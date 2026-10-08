import { PrismaClient } from "@prisma/client";
import { AuthedSession } from "./_lib/authed-session";

/**
 * End-to-end test of Phase 0's independent-teacher subject/class-level
 * restriction: a teacher may only assign curriculum (via
 * `learningIndicatorId`) to a planner when its subject AND class level are
 * both in their own `TeacherProfileSubject` / `TeacherProfileClassLevel`
 * registrations. Registers its own throwaway teacher fixtures through the
 * real `/api/auth/register` endpoint (never touches the curriculum master
 * data), exercises every write path (create, autosave/assign, duplicate,
 * publish, AI generation) directly against a live dev server, and cleans
 * up every fixture it creates at the end — matching the project's existing
 * script-based test conventions (see scripts/test-auth.ts,
 * scripts/test-planner-list-api.ts).
 *
 *   npx tsx scripts/test-planner-subject-class-restrictions.ts
 */
const prisma = new PrismaClient();

let passed = 0;
let failed = 0;

function assert(condition: unknown, message: string): void {
  if (condition) {
    passed++;
    console.log(`  ok - ${message}`);
  } else {
    failed++;
    console.error(`  FAIL - ${message}`);
  }
}

const EMAIL_PREFIX = "test-restrict-teacher";

/** Sweeps up fixtures left behind by an interrupted prior run, before this run creates its own. */
async function cleanupOrphanedFixturesFromPriorRuns(): Promise<void> {
  const pattern = { startsWith: `${EMAIL_PREFIX}-` };
  const orphaned = await prisma.user.findMany({ where: { email: pattern }, select: { id: true, email: true } });
  if (orphaned.length === 0) return;
  console.log(
    `  (cleanup) removing ${orphaned.length} leftover fixture(s) from an earlier interrupted run: ${orphaned.map((u) => u.email).join(", ")}`,
  );
  await prisma.lessonPlanner.deleteMany({ where: { teacher: { user: { email: pattern } } } });
  await prisma.teacherProfile.deleteMany({ where: { user: { email: pattern } } });
  await prisma.user.deleteMany({ where: { email: pattern } });
}

let registrationCounter = 0;

/** Registers a fresh throwaway teacher with exactly the given subject/class-level ids via the real registration endpoint. */
async function registerTeacher(
  subjectIds: string[],
  classLevelIds: string[],
): Promise<{ session: AuthedSession; email: string }> {
  registrationCounter++;
  const email = `${EMAIL_PREFIX}-${Date.now()}-${registrationCounter}@example.edu.gh`;
  const session = new AuthedSession();
  const res = await session.post("/api/auth/register", {
    name: "Restriction Test Teacher",
    email,
    password: "RestrictTest1!",
    confirmPassword: "RestrictTest1!",
    schoolName: "Restriction Test School",
    subjectIds,
    classLevelIds,
  });
  if (res.status !== 201) {
    throw new Error(`Failed to register test teacher ${email}: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return { session, email };
}

interface CurriculumFixture {
  subjectId: string;
  classLevelId: string;
  indicatorId: string;
}

/** Resolves a real subject + class level + one of their learning indicators, straight from the (untouched) curriculum master data. */
async function findCurriculum(subjectName: string, classLevelName: string): Promise<CurriculumFixture> {
  const subject = await prisma.subject.findFirstOrThrow({ where: { name: subjectName } });
  const classLevel = await prisma.classLevel.findFirstOrThrow({ where: { name: classLevelName } });
  const indicator = await prisma.learningIndicator.findFirstOrThrow({
    where: {
      learningOutcome: {
        contentStandard: { subStrand: { strand: { subjectId: subject.id, classLevelId: classLevel.id } } },
      },
    },
  });
  return { subjectId: subject.id, classLevelId: classLevel.id, indicatorId: indicator.id };
}

async function main() {
  await cleanupOrphanedFixturesFromPriorRuns();
  const createdTeacherEmails: string[] = [];

  console.log("Resolving curriculum fixtures (read-only, no curriculum data modified)...");
  const computingShs1 = await findCurriculum("Computing", "SHS 1");
  const computingShs2 = await findCurriculum("Computing", "SHS 2");
  const physicsShs1 = await findCurriculum("Physics", "SHS 1");
  const mathShs1 = await findCurriculum("Mathematics", "SHS 1");
  const mathShs2 = await findCurriculum("Mathematics", "SHS 2");

  try {
    // --- Tests A, B, C, D, I: a single-subject, single-class-level teacher ---
    console.log("\nTests A/B/C/D/I: teacher registered only for Computing + SHS 1");
    const { session: narrow, email: narrowEmail } = await registerTeacher(
      [computingShs1.subjectId],
      [computingShs1.classLevelId],
    );
    createdTeacherEmails.push(narrowEmail);

    const draftA = await narrow.post("/api/planners");
    assert(draftA.status === 201, "start draft -> 201");
    const draftAId: string = draftA.body.data.id;

    const stepA = await narrow.patch(`/api/planners/${draftAId}`, {
      learningIndicatorId: computingShs1.indicatorId,
    });
    assert(stepA.status === 200, "Test A: authorised subject (Computing) accepted -> 200");

    const stepB = await narrow.patch(`/api/planners/${draftAId}`, {
      learningIndicatorId: physicsShs1.indicatorId,
    });
    assert(stepB.status === 403, "Test B: unauthorised subject (Physics) rejected -> 403");
    assert(stepB.body?.error?.code === "FORBIDDEN", "Test B: rejection uses the FORBIDDEN error code");

    const draftC = await narrow.post("/api/planners");
    const draftCId: string = draftC.body.data.id;
    const stepC = await narrow.patch(`/api/planners/${draftCId}`, {
      learningIndicatorId: computingShs1.indicatorId,
    });
    assert(stepC.status === 200, "Test C: authorised class level (SHS 1) accepted -> 200");

    const stepD = await narrow.patch(`/api/planners/${draftCId}`, {
      learningIndicatorId: computingShs2.indicatorId,
    });
    assert(stepD.status === 403, "Test D: unauthorised class level (SHS 2) rejected -> 403");

    console.log("\nTest I: a direct API call cannot bypass the restriction");
    const bypassAttempt = await narrow.patch(`/api/planners/${draftAId}`, {
      learningIndicatorId: physicsShs1.indicatorId,
    });
    assert(bypassAttempt.status === 403, "Test I: direct PATCH with an unauthorised subject is rejected -> 403");
    const verifyUnchanged = await narrow.get(`/api/planners/${draftAId}`);
    assert(
      verifyUnchanged.body.data.learningIndicatorId === computingShs1.indicatorId,
      "Test I: the planner's stored assignment is unchanged after the rejected bypass attempt",
    );

    console.log("\nTest J: AI generation cannot be used to bypass the restriction");
    const draftJ = await narrow.post("/api/planners");
    const draftJId: string = draftJ.body.data.id;
    const rejectedAssign = await narrow.patch(`/api/planners/${draftJId}`, {
      learningIndicatorId: physicsShs1.indicatorId,
    });
    assert(rejectedAssign.status === 403, "Test J setup: unauthorised assignment attempt is rejected -> 403");
    const aiAttempt = await narrow.post(`/api/planners/${draftJId}/ai/essential-questions`);
    assert(
      aiAttempt.status !== 200,
      `Test J: AI generation refuses to run without an authorised curriculum assignment (got ${aiAttempt.status})`,
    );

    // --- Test E: a multi-subject, multi-class-level teacher; subject and class level are independent axes ---
    console.log("\nTest E: teacher registered for Computing + Mathematics, SHS 1 + SHS 2");
    const { session: multi, email: multiEmail } = await registerTeacher(
      [computingShs1.subjectId, mathShs1.subjectId],
      [computingShs1.classLevelId, mathShs2.classLevelId],
    );
    createdTeacherEmails.push(multiEmail);

    const draftE1 = await multi.post("/api/planners");
    const draftE1Id: string = draftE1.body.data.id;
    const stepE1 = await multi.patch(`/api/planners/${draftE1Id}`, {
      learningIndicatorId: computingShs1.indicatorId,
    });
    assert(stepE1.status === 200, "Test E: Computing / SHS 1 (registered combo) accepted -> 200");

    const draftE2 = await multi.post("/api/planners");
    const draftE2Id: string = draftE2.body.data.id;
    const stepE2 = await multi.patch(`/api/planners/${draftE2Id}`, { learningIndicatorId: mathShs2.indicatorId });
    assert(stepE2.status === 200, "Test E: Mathematics / SHS 2 (registered combo) accepted -> 200");

    const draftE3 = await multi.post("/api/planners");
    const draftE3Id: string = draftE3.body.data.id;
    const stepE3 = await multi.patch(`/api/planners/${draftE3Id}`, { learningIndicatorId: mathShs1.indicatorId });
    assert(
      stepE3.status === 200,
      "Test E: Mathematics / SHS 1 (subject and class level are independent, both individually registered) accepted -> 200",
    );

    // --- Test H: cross-teacher isolation is preserved ---
    console.log("\nTest H: cross-teacher isolation preserved");
    const crossGet = await multi.get(`/api/planners/${draftAId}`);
    assert(crossGet.status === 404, "Test H: a different teacher cannot read this teacher's planner -> 404");
    const crossPatch = await multi.patch(`/api/planners/${draftAId}`, { essentialQuestions: ["hack attempt"] });
    assert(crossPatch.status === 404, "Test H: a different teacher cannot modify this teacher's planner -> 404");

    // --- Test F: an incomplete profile blocks creating a new lesson plan ---
    console.log("\nTest F: teacher with no registered subjects or class levels");
    const { session: empty, email: emptyEmail } = await registerTeacher([], []);
    createdTeacherEmails.push(emptyEmail);
    const draftF = await empty.post("/api/planners");
    assert(draftF.status === 403, "Test F: planner creation is rejected for an incomplete profile -> 403");
    assert(
      typeof draftF.body?.error?.message === "string" &&
        draftF.body.error.message.toLowerCase().includes("teaching profile"),
      "Test F: the rejection message guides the teacher to complete their profile",
    );

    // --- Test G: historical plans remain accessible, and content-only edits
    //     to an existing draft remain possible, after the profile narrows ---
    console.log("\nTest G: historical plans and content-only edits survive a profile change");
    const { session: shrinking, email: shrinkingEmail } = await registerTeacher(
      [computingShs1.subjectId],
      [computingShs1.classLevelId],
    );
    createdTeacherEmails.push(shrinkingEmail);

    // G1: a planner published while Computing/SHS1 was authorised.
    const draftG1 = await shrinking.post("/api/planners");
    const draftG1Id: string = draftG1.body.data.id;
    await shrinking.patch(`/api/planners/${draftG1Id}`, {
      classSection: "SHS 1 Gold",
      term: "TERM_1",
      weekNumber: 1,
      lessonNumber: 1,
      durationMinutes: 40,
      learningIndicatorId: computingShs1.indicatorId,
    });
    await shrinking.patch(`/api/planners/${draftG1Id}`, {
      lessonActivities: [
        {
          stage: "CLOSURE",
          label: "Wrap up",
          sequence: 1,
          durationMinutes: 5,
          teacherActivity: "Summarise",
          learnerActivity: "Reflect",
        },
      ],
      assessments: [{ dokLevel: "LEVEL_1", description: "Exit ticket", sequence: 1 }],
    });
    const publishG1 = await shrinking.post(`/api/planners/${draftG1Id}/publish`);
    assert(publishG1.status === 200, "Test G setup: planner published while Computing/SHS1 was authorised -> 200");

    // G2: a second, still-unpublished draft with the same authorised assignment.
    const draftG2 = await shrinking.post("/api/planners");
    const draftG2Id: string = draftG2.body.data.id;
    const assignG2 = await shrinking.patch(`/api/planners/${draftG2Id}`, {
      learningIndicatorId: computingShs1.indicatorId,
    });
    assert(assignG2.status === 200, "Test G setup: second draft assigned Computing/SHS1 while authorised -> 200");

    // Now narrow the profile to nothing.
    const shrinkProfile = await shrinking.patch("/api/profile", {
      name: "Restriction Test Teacher",
      schoolName: "Restriction Test School",
      subjectIds: [],
      classLevelIds: [],
    });
    assert(shrinkProfile.status === 200, "Test G setup: profile narrowed to no subjects/class levels -> 200");

    const viewG1 = await shrinking.get(`/api/planners/${draftG1Id}`);
    assert(viewG1.status === 200, "Test G: the published historical planner is still viewable -> 200");
    assert(
      viewG1.body.data.learningIndicatorId === computingShs1.indicatorId,
      "Test G: the historical planner's curriculum assignment is unchanged",
    );

    // Content-only edit (no change to learningIndicatorId) must still succeed.
    const contentEditG2 = await shrinking.patch(`/api/planners/${draftG2Id}`, {
      essentialQuestions: ["Still editable after the profile narrowed?"],
      learningIndicatorId: computingShs1.indicatorId, // unchanged — resent exactly as the real wizard's autosave does
    });
    assert(
      contentEditG2.status === 200,
      "Test G: a content-only edit (same, already-authorised assignment resent) is still allowed -> 200",
    );

    // But acquiring a *new* assignment is blocked now that the profile is empty.
    const newAssignG2 = await shrinking.patch(`/api/planners/${draftG2Id}`, {
      learningIndicatorId: physicsShs1.indicatorId,
    });
    assert(
      newAssignG2.status === 403,
      "Test G: acquiring a *new* curriculum assignment is blocked once the profile no longer authorises anything -> 403",
    );

    // Duplicating a planner whose assignment is no longer authorised is also blocked.
    const duplicateG1 = await shrinking.post(`/api/planners/${draftG1Id}/duplicate`);
    assert(
      duplicateG1.status === 403,
      "Test G: duplicating a planner into a new one requires *current* authorisation -> 403",
    );
  } finally {
    console.log("\nCleaning up fixtures...");
    await prisma.lessonPlanner.deleteMany({ where: { teacher: { user: { email: { in: createdTeacherEmails } } } } });
    await prisma.teacherProfile.deleteMany({ where: { user: { email: { in: createdTeacherEmails } } } });
    await prisma.user.deleteMany({ where: { email: { in: createdTeacherEmails } } });
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

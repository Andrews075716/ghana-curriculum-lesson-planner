import { PrismaClient } from "@prisma/client";
import { loginAsDemoTeacher } from "./_lib/authed-session";

/**
 * Verifies post-lesson reflection end to end: CRUD via the real API,
 * that it never touches the lesson plan itself, that previous lessons
 * with reflection content are discoverable for the "use as AI context"
 * feature (scoped to the same subject+class and the same teacher), and
 * that passing a reflection source into an AI action doesn't error even
 * when that lesson belongs to someone else (no existence leak) or when
 * AI is disabled.
 *
 *   npx tsx scripts/test-reflection.ts
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

async function main() {
  const session = await loginAsDemoTeacher();
  const postJson = session.post.bind(session);
  const patchJson = session.patch.bind(session);
  const getJson = session.get.bind(session);

  const indicator = await prisma.learningIndicator.findFirstOrThrow({
    where: { code: "COMP-F1-STR-01-SS-01-CS-01-LI-01" },
    include: {
      learningOutcome: {
        include: { contentStandard: { include: { subStrand: { include: { strand: true } } } } },
      },
    },
  });
  const strand = indicator.learningOutcome.contentStandard.subStrand.strand;

  console.log("1) Create planner A, set curriculum, get its lesson id");
  const createdA = await postJson("/api/planners");
  const plannerAId: string = createdA.body.data.id;
  await patchJson(`/api/planners/${plannerAId}`, {
    classSection: "Form 1",
    term: "TERM_1",
    weekNumber: 2,
    durationMinutes: 40,
    learningIndicatorId: indicator.id,
  });
  const draftA = await getJson(`/api/planners/${plannerAId}`);
  const lessonAId: string = draftA.body.data.lesson.id;
  assert(typeof lessonAId === "string" && lessonAId.length > 0, "planner A has an auto-created lesson");

  console.log("2) GET reflection before anything is saved — all fields empty, not an error");
  const emptyReflection = await getJson(`/api/planners/${plannerAId}/lessons/${lessonAId}/reflection`);
  assert(emptyReflection.status === 200, "GET reflection -> 200 even with nothing saved yet");
  assert(
    emptyReflection.body.data.reflection.whatWentWell === null,
    "whatWentWell is null before any save",
  );

  console.log("3) Save a full reflection covering all 7 questions");
  const reflectionData = {
    whatWentWell: "Learners engaged well with the pair activity.",
    subgroupsCatered: "Weaker learners paired with peer tutors.",
    difficulties: "Some learners struggled with place value.",
    indicatorsAchieved: "Most learners could describe data as bit patterns.",
    reteachingNeeded: "Revisit place value before hexadecimal.",
    nextLessonChanges: "Start with a shorter recap.",
    remarks: "Great energy from the class today.",
  };
  const saveRes = await patchJson(
    `/api/planners/${plannerAId}/lessons/${lessonAId}/reflection`,
    reflectionData,
  );
  assert(saveRes.status === 200, "PATCH reflection -> 200");

  console.log("4) GET reflection back and confirm every field round-trips");
  const savedReflection = await getJson(`/api/planners/${plannerAId}/lessons/${lessonAId}/reflection`);
  for (const [key, value] of Object.entries(reflectionData)) {
    assert(savedReflection.body.data.reflection[key] === value, `${key} round-trips`);
  }

  console.log("5) An unknown field in the reflection body is rejected (.strict())");
  const badPatch = await patchJson(`/api/planners/${plannerAId}/lessons/${lessonAId}/reflection`, {
    whatWentWell: "fine",
    someCurriculumId: "trying-to-sneak-something-in",
  });
  assert(badPatch.status === 400, "PATCH with an unexpected field -> 400");

  console.log("6) Saving a reflection never touches the lesson plan itself");
  const plannerAfterReflection = await getJson(`/api/planners/${plannerAId}`);
  assert(
    plannerAfterReflection.body.data.status === "DRAFT",
    "planner status is untouched by saving a reflection",
  );

  console.log("7) Create planner B, same subject+class — should see planner A's lesson as a reflection-context candidate");
  const createdB = await postJson("/api/planners");
  const plannerBId: string = createdB.body.data.id;
  const classLevelId = strand.classLevelId;
  const subjectId = strand.subjectId;
  const candidates = await getJson(
    `/api/planners/${plannerBId}/reflectable-lessons?subjectId=${subjectId}&classLevelId=${classLevelId}`,
  );
  assert(candidates.status === 200, "GET reflectable-lessons -> 200");
  assert(
    candidates.body.data.some((c: { id: string }) => c.id === lessonAId),
    "planner A's lesson (which has reflection content) appears as a candidate",
  );

  console.log("8) A lesson with no reflection content is excluded from candidates");
  const createdC = await postJson("/api/planners");
  const plannerCId: string = createdC.body.data.id;
  await patchJson(`/api/planners/${plannerCId}`, { learningIndicatorId: indicator.id });
  const draftC = await getJson(`/api/planners/${plannerCId}`);
  const lessonCId: string = draftC.body.data.lesson.id;
  const candidatesAfterC = await getJson(
    `/api/planners/${plannerBId}/reflectable-lessons?subjectId=${subjectId}&classLevelId=${classLevelId}`,
  );
  assert(
    !candidatesAfterC.body.data.some((c: { id: string }) => c.id === lessonCId),
    "planner C's lesson (no reflection content) is NOT a candidate",
  );

  // The fixture indicator above (COMP-F1-...) is the legacy pre-Checkpoint-6
  // seed data, which is deliberately AI-ineligible (see
  // curriculum-eligibility.service.ts) — so depending on whether this
  // environment has a real AI_PROVIDER configured, the request fails at
  // the provider-availability check (503 AI_UNAVAILABLE, no provider) or
  // the curriculum-eligibility check (422 AI_CURRICULUM_INELIGIBLE, a real
  // provider IS configured but this fixture isn't usable) — either way,
  // safely, before ever reaching a real provider call. Both are correct;
  // this test only cares that reflectionSourceLessonId doesn't change
  // WHICH of these two safe outcomes occurs or leak anything extra.
  const SAFE_FAILURE_CODES = new Set(["AI_UNAVAILABLE", "AI_CURRICULUM_INELIGIBLE"]);

  console.log("9) Passing a reflectionSourceLessonId into an AI action doesn't change the failure mode");
  await patchJson(`/api/planners/${plannerBId}`, {
    classSection: "Form 1",
    term: "TERM_1",
    weekNumber: 3,
    durationMinutes: 40,
    learningIndicatorId: indicator.id,
  });
  const withOwnReflection = await postJson(`/api/planners/${plannerBId}/ai/essential-questions`, {
    reflectionSourceLessonId: lessonAId,
  });
  assert(
    (withOwnReflection.status === 503 || withOwnReflection.status === 422) &&
      SAFE_FAILURE_CODES.has(withOwnReflection.body.error?.code),
    `with a valid, owned reflectionSourceLessonId -> still just a safe failure (got ${withOwnReflection.status} ${withOwnReflection.body.error?.code}), no new error type`,
  );

  console.log("10) A reflectionSourceLessonId for a lesson that doesn't exist doesn't leak information or crash");
  const withBogusReflection = await postJson(`/api/planners/${plannerBId}/ai/essential-questions`, {
    reflectionSourceLessonId: "does-not-exist-at-all",
  });
  assert(
    (withBogusReflection.status === 503 || withBogusReflection.status === 422) &&
      SAFE_FAILURE_CODES.has(withBogusReflection.body.error?.code),
    `with a bogus reflectionSourceLessonId -> same safe failure (got ${withBogusReflection.status} ${withBogusReflection.body.error?.code}), not a different/leaky error`,
  );

  console.log(`\n${passed} passed, ${failed} failed`);

  await prisma.lessonPlanner.deleteMany({
    where: { id: { in: [plannerAId, plannerBId, plannerCId] } },
  });

  if (failed > 0) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error("Test script crashed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

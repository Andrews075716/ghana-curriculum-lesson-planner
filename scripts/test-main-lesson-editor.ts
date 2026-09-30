import { PrismaClient } from "@prisma/client";
import { loginAsDemoTeacher } from "./_lib/authed-session";

/**
 * Targeted checks for the unified Main Lesson activity editor's backend
 * semantics: duplicate rows are allowed, reordering (sequence) round-trips,
 * and publish is rejected when no CLOSURE-stage row is present.
 *
 *   npx tsx <this file>
 */
const prisma = new PrismaClient();

let passed = 0;
let failed = 0;

function assert(condition: unknown, message: string): asserts condition {
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

  const indicatorRow = await prisma.learningIndicator.findFirstOrThrow({
    where: { code: "COMP-F1-STR-01-SS-01-CS-01-LI-01" },
  });

  console.log("1) Create a draft and fill required non-activity fields");
  const created = await postJson("/api/planners");
  const plannerId: string = created.body.data.id;
  await patchJson(`/api/planners/${plannerId}`, {
    classSection: "Form 1",
    term: "TERM_1",
    weekNumber: 1,
    durationMinutes: 40,
    learningIndicatorId: indicatorRow.id,
  });

  console.log("2) Duplicate rows (same label/content, different sequence) are accepted");
  const dup = await patchJson(`/api/planners/${plannerId}`, {
    lessonActivities: [
      {
        stage: "STARTER",
        label: "Starter",
        sequence: 1,
        durationMinutes: 5,
        teacherActivity: "Greet learners",
        learnerActivity: "Settle in",
      },
      {
        stage: "STARTER",
        label: "Starter",
        sequence: 2,
        durationMinutes: 5,
        teacherActivity: "Greet learners",
        learnerActivity: "Settle in",
      },
    ],
    assessments: [{ dokLevel: "LEVEL_1", description: "Quick check", sequence: 1 }],
  });
  assert(dup.status === 200, "PATCH with two duplicate-content activities -> 200");

  console.log("3) Publish without a CLOSURE-stage activity is rejected");
  const publishNoClosure = await postJson(`/api/planners/${plannerId}/publish`);
  assert(publishNoClosure.status === 400, "publish without a CLOSURE row -> 400");
  assert(
    typeof publishNoClosure.body.error?.message === "string" &&
      publishNoClosure.body.error.message.includes("lessonActivities"),
    "error names lessonActivities as the problem",
  );

  console.log("4) Reordering: replace-all with swapped sequence order round-trips correctly");
  const reordered = await patchJson(`/api/planners/${plannerId}`, {
    lessonActivities: [
      {
        stage: "ACTIVITY",
        label: "Activity 1",
        sequence: 1,
        durationMinutes: 10,
        teacherActivity: "Demo",
        learnerActivity: "Watch",
      },
      {
        stage: "STARTER",
        label: "Starter",
        sequence: 2,
        durationMinutes: 5,
        teacherActivity: "Greet learners",
        learnerActivity: "Settle in",
      },
      {
        stage: "CLOSURE",
        label: "Lesson Closure",
        sequence: 3,
        durationMinutes: 5,
        teacherActivity: "Wrap up",
        learnerActivity: "Reflect",
      },
    ],
  });
  assert(reordered.status === 200, "PATCH reordered activities -> 200");

  const afterReorder = await getJson(`/api/planners/${plannerId}`);
  const rows = afterReorder.body.data.lesson.lessonActivities as Array<{
    stage: string;
    sequence: number;
  }>;
  assert(rows.length === 3, "exactly 3 activities after reorder (old 2 replaced, not appended)");
  assert(
    rows[0].stage === "ACTIVITY" && rows[0].sequence === 1,
    "first row after reorder is Activity 1 at sequence 1",
  );
  assert(
    rows[1].stage === "STARTER" && rows[1].sequence === 2,
    "second row after reorder is Starter at sequence 2",
  );
  assert(
    rows[2].stage === "CLOSURE" && rows[2].sequence === 3,
    "third row after reorder is Lesson Closure at sequence 3",
  );

  console.log("5) Publish now succeeds (CLOSURE row present, assessment present)");
  const publishOk = await postJson(`/api/planners/${plannerId}/publish`);
  assert(publishOk.status === 200, "publish with a CLOSURE row present -> 200");

  console.log(`\n${passed} passed, ${failed} failed`);

  await prisma.lessonPlanner.delete({ where: { id: plannerId } });

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

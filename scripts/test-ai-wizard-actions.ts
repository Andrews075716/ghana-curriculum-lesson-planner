import { PrismaClient } from "@prisma/client";
import { loginAsDemoTeacher, AuthedSession } from "./_lib/authed-session";

/**
 * Verifies the wizard-facing AI action route
 * (`POST /api/planners/[id]/ai/[action]`) for all 8 sections, end to end
 * against the live dev server: each action resolves curriculum context
 * correctly and — since AI_PROVIDER=none in this environment — fails
 * safely with AIUnavailableError (503), never a crash or an unhandled
 * exception. Also checks the route rejects an unknown action and a
 * planner missing curriculum alignment.
 *
 *   npx tsx scripts/test-ai-wizard-actions.ts
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

const ACTIONS = [
  "essential-questions",
  "pedagogical-strategies",
  "teaching-learning-resources",
  "differentiation",
  "pedagogical-exemplars",
  "lesson-activities",
  "assessments",
  "closure",
];

async function main() {
  const session = await loginAsDemoTeacher();
  const postJson = session.post.bind(session);
  const patchJson = session.patch.bind(session);

  console.log("1) A planner missing curriculum alignment -> ValidationError, not a crash");
  const bare = await postJson("/api/planners");
  const barePlannerId: string = bare.body.data.id;
  const bareResult = await postJson(`/api/planners/${barePlannerId}/ai/essential-questions`);
  assert(bareResult.status === 400, "missing curriculum alignment -> 400");
  assert(bareResult.body.error?.code === "VALIDATION_ERROR", "error code is VALIDATION_ERROR");

  console.log("2) Set up a fully curriculum-aligned draft");
  const created = await postJson("/api/planners");
  const plannerId: string = created.body.data.id;
  const indicator = await prisma.learningIndicator.findFirstOrThrow({
    where: { code: "COMP-F1-STR-01-SS-01-CS-01-LI-01" },
  });
  await patchJson(`/api/planners/${plannerId}`, {
    classSection: "Form 1",
    term: "TERM_1",
    weekNumber: 3,
    durationMinutes: 45,
    learningIndicatorId: indicator.id,
  });

  console.log("3) Every one of the 8 wizard sections' AI action fails safely (AI_PROVIDER=none)");
  for (const action of ACTIONS) {
    const result = await postJson(`/api/planners/${plannerId}/ai/${action}`, { count: 3 });
    assert(
      result.status === 503 && result.body.error?.code === "AI_UNAVAILABLE",
      `${action} -> 503 AI_UNAVAILABLE (got ${result.status} ${result.body?.error?.code})`,
    );
  }

  console.log("3b) full-lesson-draft (not a wizard-step action, but wired the same way) also fails safely");
  const fullDraftResult = await postJson(`/api/planners/${plannerId}/ai/full-lesson-draft`);
  assert(
    fullDraftResult.status === 503 && fullDraftResult.body.error?.code === "AI_UNAVAILABLE",
    `full-lesson-draft -> 503 AI_UNAVAILABLE (got ${fullDraftResult.status} ${fullDraftResult.body?.error?.code})`,
  );

  console.log("4) An unknown action is rejected cleanly");
  const unknown = await postJson(`/api/planners/${plannerId}/ai/not-a-real-action`);
  assert(unknown.status === 400, "unknown action -> 400");
  assert(unknown.body.error?.code === "VALIDATION_ERROR", "error code is VALIDATION_ERROR");

  console.log("5) No teacher session -> 403 FORBIDDEN, not a crash");
  const anon = new AuthedSession();
  const anonResult = await anon.post(`/api/planners/${plannerId}/ai/essential-questions`);
  assert(anonResult.status === 403, `unauthenticated call -> 403 (got ${anonResult.status})`);
  assert(
    (anonResult.body as { error?: { code?: string } } | null)?.error?.code === "FORBIDDEN",
    "error code is FORBIDDEN",
  );

  console.log(`\n${passed} passed, ${failed} failed`);

  await prisma.lessonPlanner.deleteMany({ where: { id: { in: [barePlannerId, plannerId] } } });

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

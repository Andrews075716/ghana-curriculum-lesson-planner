import { PrismaClient } from "@prisma/client";
import { loginAsDemoTeacher, AuthedSession } from "./_lib/authed-session";

/**
 * Verifies the wizard-facing AI action route
 * (`POST /api/planners/[id]/ai/[action]`) for all 8 sections plus
 * full-lesson-draft, end to end against the live dev server: every action
 * fails safely, never a crash or an unhandled exception. Also checks the
 * route rejects an unknown action and a planner missing curriculum
 * alignment.
 *
 * Deliberately uses a curriculum fixture that is AI-INELIGIBLE (the
 * pre-Checkpoint-6 legacy Computing/Form-1 seed data — predates
 * `extractionStatus` entirely; see curriculum-eligibility.service.ts) so
 * this test is safe to run in ANY environment regardless of whether a real
 * AI_PROVIDER is configured: if no provider is configured, the request
 * fails at the provider-availability check (503 AI_UNAVAILABLE) before
 * curriculum is even resolved; if a real provider IS configured (e.g. via
 * a local .env.local), it instead fails at the curriculum-eligibility
 * check (422 AI_CURRICULUM_INELIGIBLE) — in BOTH cases the request returns
 * before `AIProvider.generate*()` is ever called, so this test can never
 * trigger a real, billed API call no matter what's configured. A live
 * end-to-end smoke test against a real provider and an ELIGIBLE fixture is
 * a separate, deliberate, manually-run thing — never part of this
 * automated suite (see docs/checkpoint-8-ai-integration.md's "Known
 * limitations").
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

  console.log("3) Every one of the 8 wizard sections' AI action fails safely, and never reaches the real provider");
  const SAFE_FAILURE_CODES = new Set(["AI_UNAVAILABLE", "AI_CURRICULUM_INELIGIBLE"]);
  for (const action of ACTIONS) {
    const result = await postJson(`/api/planners/${plannerId}/ai/${action}`, { count: 3 });
    const code = result.body?.error?.code;
    assert(
      (result.status === 503 || result.status === 422) && SAFE_FAILURE_CODES.has(code),
      `${action} -> safe failure, 503 AI_UNAVAILABLE or 422 AI_CURRICULUM_INELIGIBLE (got ${result.status} ${code})`,
    );

    // Regression test for the manual-browser-acceptance "AI Suggestion isn't
    // working" report: reproduced to be this exact scenario (Computing/Form-1,
    // the original demo curriculum, correctly rejected as AI-ineligible with a
    // clean 422) rather than a bug. Locks in that the response a teacher's
    // browser actually receives is safe and legible, not just that *some*
    // error code came back.
    if (code === "AI_CURRICULUM_INELIGIBLE") {
      const message: string = result.body?.error?.message ?? "";
      assert(message.length > 0, `${action}: AI_CURRICULUM_INELIGIBLE response includes a message`);
      assert(
        !/extractionStatus|reviewStatus|sourcePage|prisma|id=c[a-z0-9]{20,}/i.test(message),
        `${action}: message exposes no internal field names or database ids`,
      );
    }
  }

  console.log("3b) full-lesson-draft (not a wizard-step action, but wired the same way) also fails safely");
  const fullDraftResult = await postJson(`/api/planners/${plannerId}/ai/full-lesson-draft`);
  const fullDraftCode = fullDraftResult.body?.error?.code;
  assert(
    (fullDraftResult.status === 503 || fullDraftResult.status === 422) && SAFE_FAILURE_CODES.has(fullDraftCode),
    `full-lesson-draft -> safe failure, 503 AI_UNAVAILABLE or 422 AI_CURRICULUM_INELIGIBLE (got ${fullDraftResult.status} ${fullDraftCode})`,
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

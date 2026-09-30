// Regression test for a manual browser acceptance report: "Failed to save."
// and (separately) AI Full Lesson Draft's "Something went wrong generating
// a suggestion." using a real curriculum path (Agricultural Science / SHS 1
// / NEW DAWN IN AGRICULTURE / EMERGING TECHNOLOGIES IN AGRICULTURE /
// 1.1.2.CS.1 / 1.1.2.LO.1 / 1.1.2.LI.1).
//
// Root cause found: a severely degraded long-lived dev server process
// (repeated "Jest worker encountered 2 child process exceptions" and
// "write EPIPE" uncaught exceptions in its own log) — not an application
// defect. Both `saveDraft()` (WizardShell.tsx) and `requestAISuggestion()`
// (ai-client.ts) fall back to a generic message specifically when a
// response can't be parsed as the expected JSON error envelope, which is
// exactly what a crashed server's raw error page produces. Restarting the
// dev server resolved both symptoms immediately; this script locks in that
// the underlying request/response contract is correct for this exact
// curriculum content against a healthy server.
//
// IMPORTANT (this is the second version of this file): the first version
// made AI requests over HTTP against the live dev server while setting
// process.env.AI_PROVIDER="mock" only in THIS script's own process — since
// the dev server is a SEPARATE process, that override had no effect, and
// those HTTP calls went to the real, live, billed Anthropic API (caught
// and disclosed immediately, not repeated). Fixed by calling ai.service.ts
// DIRECTLY (in-process) for every AI-touching assertion below, exactly
// like test-ai-duration-validation.ts and test-checkpoint9-e2e.ts already
// do — that is the only way a script's own AI_PROVIDER override actually
// takes effect. SAVE (section 1) has zero AI involvement and safely stays
// HTTP-based, matching what the browser's Save actually does.
process.env.AI_PROVIDER = "mock";

import { PrismaClient } from "@prisma/client";
import { AIActivityDurationExceededError } from "@/server/errors/app-error";
import * as aiService from "@/server/services/ai.service";
import { createDraftPlanner, updatePlannerDraft } from "@/server/repositories/planner.repository";
import { loginAsDemoTeacher } from "./_lib/authed-session";

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
  const indicator = await prisma.learningIndicator.findFirstOrThrow({
    where: {
      code: "1.1.2.LI.1",
      learningOutcome: {
        contentStandard: { subStrand: { name: { contains: "EMERGING TECHNOLOGIES IN AGRICULTURE" } } },
      },
    },
  });
  console.log("Fixture resolved: Agricultural Science / SHS 1 /", indicator.code);

  const teacher = await prisma.teacherProfile.findFirstOrThrow({
    where: { user: { email: "demo.teacher@example.edu.gh" } },
  });
  const createdPlannerIds: string[] = [];

  console.log("\n1) SAVE (real HTTP, no AI involved, safe): create a planner and PATCH the exact Basic Info + Curriculum Alignment payload");
  const session = await loginAsDemoTeacher();
  const created = await session.post("/api/planners");
  const plannerId: string = created.body.data.id;
  createdPlannerIds.push(plannerId);
  assert(created.status === 201, "POST /api/planners -> 201");

  const patch = await session.patch(`/api/planners/${plannerId}`, {
    classSection: "Form 1 Gold",
    term: "TERM_1",
    weekNumber: 5,
    lessonNumber: 1,
    durationMinutes: 90,
    learningIndicatorId: indicator.id,
  });
  assert(patch.status === 200, `PATCH curriculum+duration -> 200 (got ${patch.status})`);
  assert(patch.body?.data?.saved === true, "PATCH response body has the expected { data: { saved: true } } shape");

  const reopened = await session.get(`/api/planners/${plannerId}`);
  assert(reopened.status === 200, "GET the draft back -> 200");
  assert(
    reopened.body?.data?.learningIndicatorId === indicator.id,
    "the exact Agriculture Learning Indicator id round-trips correctly",
  );

  console.log("\n2) AI (in-process, AI_PROVIDER=mock, ZERO live cost): essential-questions for this exact curriculum");
  const eqResult = await aiService.generateEssentialQuestions(plannerId, teacher.id);
  assert(eqResult.meta.provider === "mock", "confirms zero live Anthropic cost (mock provider)");
  assert(eqResult.suggestion.essentialQuestions.length > 0, "essential-questions returns real content for this Agriculture indicator");

  console.log("\n3) AI (in-process, mock): full-lesson-draft for this exact curriculum, generous duration -> succeeds");
  await updatePlannerDraft(plannerId, teacher.id, { durationMinutes: 90 });
  const fullDraftResult = await aiService.generateFullLessonDraft(plannerId, teacher.id);
  assert(fullDraftResult.meta.provider === "mock", "confirms zero live Anthropic cost (mock provider)");
  assert(
    fullDraftResult.suggestion.lessonActivities.length > 0,
    "full-lesson-draft returns real lesson activities for this Agriculture content",
  );

  console.log("\n4) AI (in-process, mock): full-lesson-draft with an INSUFFICIENT duration -> a SPECIFIC error, not a generic one");
  const tightPlannerId = await createDraftPlanner(teacher.id, "2025/2026");
  createdPlannerIds.push(tightPlannerId);
  await updatePlannerDraft(tightPlannerId, teacher.id, {
    learningIndicatorId: indicator.id,
    durationMinutes: 45, // MockAIProvider's fixed full-draft total is 50 minutes
  });
  try {
    await aiService.generateFullLessonDraft(tightPlannerId, teacher.id);
    assert(false, "should have thrown AIActivityDurationExceededError");
  } catch (error) {
    assert(
      error instanceof AIActivityDurationExceededError,
      "throws the SPECIFIC AIActivityDurationExceededError, not a generic/unhandled error",
    );
    if (error instanceof AIActivityDurationExceededError) {
      assert(error.httpStatus === 422, "maps to HTTP 422, not a raw 500");
      assert(
        typeof error.message === "string" && error.message.length > 20,
        "carries a real, specific message a teacher would see instead of a generic fallback",
      );
      assert(
        error.expectedDuration === 45 && error.generatedDuration === 50,
        "carries the safe expectedDuration/generatedDuration diagnostic numbers",
      );
    }
  }

  console.log(`\n${passed} passed, ${failed} failed`);

  await prisma.lessonPlanner.deleteMany({ where: { id: { in: createdPlannerIds } } });
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

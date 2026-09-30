// Selects the deterministic, zero-cost MockAIProvider (see
// src/server/ai/providers/mock-ai-provider.ts) BEFORE any AI service call —
// ai-provider.factory.ts reads process.env.AI_PROVIDER fresh on every call,
// so mutating it here (before this module's own body runs any generate*
// call, though after its own imports resolve) is sufficient; nothing in
// this file makes a real Anthropic request.
process.env.AI_PROVIDER = "mock";

import { PrismaClient } from "@prisma/client";
import { AIActivityDurationExceededError } from "@/server/errors/app-error";
import * as aiService from "@/server/services/ai.service";
import { assertActivityDurationsFit } from "@/server/services/lesson-duration-validation.service";
import { LessonActivitiesSuggestionSchema, ClosureSuggestionSchema } from "@/lib/validation/ai.schema";
import { createDraftPlanner, updatePlannerDraft } from "@/server/repositories/planner.repository";

/**
 * Deterministic tests for the AI-generated lesson-activity duration
 * validation added post-Checkpoint-8 (lesson-duration-validation.service.ts).
 * Uses AI_PROVIDER=mock (MockAIProvider — fixed, non-random responses) so
 * every assertion below is fully reproducible. ZERO live Anthropic calls.
 *
 *   npx tsx scripts/test-ai-duration-validation.ts
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
  const teacher = await prisma.teacherProfile.findFirstOrThrow({
    where: { user: { email: "demo.teacher@example.edu.gh" } },
  });
  const indicator = await prisma.learningIndicator.findFirstOrThrow({
    where: {
      code: "1.1.1.LI.1",
      learningOutcome: { contentStandard: { subStrand: { strand: { subject: { name: "Mathematics" } } } } },
    },
  });
  const createdPlannerIds: string[] = [];

  async function makePlanner(durationMinutes: number): Promise<string> {
    const plannerId = await createDraftPlanner(teacher.id, "2025/2026");
    createdPlannerIds.push(plannerId);
    await updatePlannerDraft(plannerId, teacher.id, { learningIndicatorId: indicator.id, durationMinutes });
    return plannerId;
  }

  // --- 1) Pure function: assertActivityDurationsFit -----------------------
  console.log("1) assertActivityDurationsFit — pure function");

  // A. exact duration match
  let threw = false;
  try {
    assertActivityDurationsFit([{ durationMinutes: 20 }, { durationMinutes: 20 }], 40, "x");
  } catch {
    threw = true;
  }
  assert(!threw, "A. exact match (20+20==40) does not throw");

  // B. exceeds
  threw = false;
  try {
    assertActivityDurationsFit([{ durationMinutes: 30 }, { durationMinutes: 20 }], 40, "x");
  } catch (e) {
    threw = e instanceof AIActivityDurationExceededError;
  }
  assert(threw, "B. 50 > 40 throws AIActivityDurationExceededError");

  // C. under duration
  threw = false;
  try {
    assertActivityDurationsFit([{ durationMinutes: 10 }], 40, "x");
  } catch {
    threw = true;
  }
  assert(!threw, "C. under-allocation (10 < 40) does not throw — matches documented policy");

  // G. multiple activities summing correctly
  threw = false;
  try {
    assertActivityDurationsFit(
      [{ durationMinutes: 5 }, { durationMinutes: 15 }, { durationMinutes: 20 }],
      40,
      "x",
    );
  } catch {
    threw = true;
  }
  assert(!threw, "G. multiple activities (5+15+20==40) does not throw");

  // Empty array (zero activities) — trivially under, never throws.
  threw = false;
  try {
    assertActivityDurationsFit([], 40, "x");
  } catch {
    threw = true;
  }
  assert(!threw, "zero activities never throws (0 <= any positive duration)");

  // I (partial, pure-function level): input is never mutated.
  const inputArr = [{ durationMinutes: 30 }, { durationMinutes: 30 }];
  const beforeJson = JSON.stringify(inputArr);
  try {
    assertActivityDurationsFit(inputArr, 40, "x");
  } catch {
    /* expected */
  }
  assert(JSON.stringify(inputArr) === beforeJson, "I. the activities array passed in is never mutated, even when it throws");

  // Diagnostic fields are correct and safe (no provider internals).
  try {
    assertActivityDurationsFit([{ durationMinutes: 55 }], 40, "x");
    assert(false, "should have thrown");
  } catch (e) {
    assert(e instanceof AIActivityDurationExceededError, "throws the right error class");
    if (e instanceof AIActivityDurationExceededError) {
      assert(e.expectedDuration === 40, "expectedDuration is the planner's configured duration");
      assert(e.generatedDuration === 55, "generatedDuration is the AI's proposed total");
      assert(e.difference === 15, "difference is generatedDuration - expectedDuration");
      assert(e.httpStatus === 422, "maps to HTTP 422");
      assert(!/anthropic|api.?key|sdk/i.test(e.message), "message contains no provider internals");
    }
  }

  // --- 2) Schema layer: D, E, F happen BEFORE semantic validation ---------
  console.log("2) Schema validation rejects zero/negative/malformed durations (before semantic validation ever runs)");

  const zeroDuration = LessonActivitiesSuggestionSchema.safeParse({
    lessonActivities: [
      { stage: "ACTIVITY", label: "x", sequence: 1, durationMinutes: 0, teacherActivity: "a", learnerActivity: "b" },
    ],
  });
  assert(!zeroDuration.success, "D. zero-minute activity duration is rejected by the schema");

  const negativeDuration = LessonActivitiesSuggestionSchema.safeParse({
    lessonActivities: [
      { stage: "ACTIVITY", label: "x", sequence: 1, durationMinutes: -5, teacherActivity: "a", learnerActivity: "b" },
    ],
  });
  assert(!negativeDuration.success, "E. negative activity duration is rejected by the schema");

  const malformedDuration = LessonActivitiesSuggestionSchema.safeParse({
    lessonActivities: [
      {
        stage: "ACTIVITY",
        label: "x",
        sequence: 1,
        durationMinutes: "forty-five" as unknown as number,
        teacherActivity: "a",
        learnerActivity: "b",
      },
    ],
  });
  assert(!malformedDuration.success, "F. non-numeric activity duration is rejected by the schema");

  const zeroClosure = ClosureSuggestionSchema.safeParse({
    closure: { stage: "CLOSURE", label: "x", sequence: 1, durationMinutes: 0, teacherActivity: "a", learnerActivity: "b" },
  });
  assert(!zeroClosure.success, "D (closure). zero-minute closure duration is rejected by the schema");

  // --- 3) Full integration through ai.service.ts + MockAIProvider ---------
  console.log("3) Integration: A. exact match (lesson-activities, 40==40) -> accepted");
  const pExact = await makePlanner(40);
  const resultExact = await aiService.generateLessonActivities(pExact, teacher.id);
  assert(resultExact.suggestion.lessonActivities.length === 2, "suggestion returned with both mock activities");
  assert(resultExact.meta.provider === "mock", "meta.provider confirms the mock provider was used (no live call)");

  console.log("4) Integration: B. over-allocation (lesson-activities, 40 > 30 planned) -> rejected");
  const pOver = await makePlanner(30);
  try {
    await aiService.generateLessonActivities(pOver, teacher.id);
    assert(false, "should have thrown AIActivityDurationExceededError");
  } catch (e) {
    assert(e instanceof AIActivityDurationExceededError, "throws AIActivityDurationExceededError, not a silent accept");
    if (e instanceof AIActivityDurationExceededError) {
      assert(
        e.expectedDuration === 30 && e.generatedDuration === 40 && e.difference === 10,
        "expectedDuration=30, generatedDuration=40, difference=10",
      );
    }
  }

  console.log("5) Integration: C. under-allocation (lesson-activities, 40 < 100 planned) -> accepted");
  const pUnder = await makePlanner(100);
  const resultUnder = await aiService.generateLessonActivities(pUnder, teacher.id);
  assert(resultUnder.suggestion.lessonActivities.length === 2, "under-allocated suggestion is still returned, not rejected");

  console.log("6) Integration: closure over-allocation (10 > 5 planned) -> rejected");
  const pClosureOver = await makePlanner(5);
  try {
    await aiService.generateClosure(pClosureOver, teacher.id);
    assert(false, "should have thrown");
  } catch (e) {
    assert(e instanceof AIActivityDurationExceededError, "generateClosure is also gated by duration validation");
  }

  console.log("7) Integration: full-lesson-draft — G. exact match (50==50) -> accepted; over-allocation -> rejected");
  const pFullExact = await makePlanner(50);
  const fullExact = await aiService.generateFullLessonDraft(pFullExact, teacher.id);
  assert(fullExact.suggestion.lessonActivities.length === 3, "full draft returns 2 main activities + 1 closure row");

  const pFullOver = await makePlanner(49);
  try {
    await aiService.generateFullLessonDraft(pFullOver, teacher.id);
    assert(false, "should have thrown");
  } catch (e) {
    assert(
      e instanceof AIActivityDurationExceededError && e.difference === 1,
      "full-lesson-draft is rejected even 1 minute over (difference=1)",
    );
  }

  // --- 8) H. Multiple lessons ----------------------------------------------
  console.log("8) H. Architecture check: a planner always has exactly one Lesson (verified, not assumed)");
  const lessonsForExact = await prisma.lesson.findMany({ where: { plannerId: pExact } });
  assert(
    lessonsForExact.length === 1,
    "createDraftPlanner creates exactly one Lesson — duration validation correctly has no multi-lesson case to get wrong today",
  );

  // --- 9) I. Existing teacher content is never touched by a rejection -----
  console.log("9) I. A rejected AI response never modifies existing teacher-entered activities");
  const lessonOver = await prisma.lesson.findFirstOrThrow({ where: { plannerId: pOver } });
  await prisma.lessonActivity.create({
    data: {
      lessonId: lessonOver.id,
      stage: "STARTER",
      label: "Teacher's own starter",
      sequence: 1,
      durationMinutes: 5,
      teacherActivity: "Teacher-written text",
      learnerActivity: "Learner-written text",
    },
  });
  const beforeRows = await prisma.lessonActivity.findMany({
    where: { lessonId: lessonOver.id },
    orderBy: { sequence: "asc" },
  });
  try {
    await aiService.generateLessonActivities(pOver, teacher.id); // rejected again (still 40 > 30)
  } catch {
    /* expected */
  }
  const afterRows = await prisma.lessonActivity.findMany({
    where: { lessonId: lessonOver.id },
    orderBy: { sequence: "asc" },
  });
  assert(
    JSON.stringify(beforeRows) === JSON.stringify(afterRows),
    "the teacher's own pre-existing LessonActivity row is byte-for-byte unchanged after a rejected AI attempt",
  );

  // --- 10) J. Rejected output is never persisted/accepted automatically ---
  console.log("10) J. Rejected provider output is never persisted");
  const activityCountForOver = await prisma.lessonActivity.count({ where: { lessonId: lessonOver.id } });
  assert(
    activityCountForOver === 1,
    "still exactly 1 activity (the teacher's own) — the rejected AI suggestion was never written to the database",
  );

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

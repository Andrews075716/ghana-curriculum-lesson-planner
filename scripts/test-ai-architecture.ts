import { PrismaClient } from "@prisma/client";
import { AppError } from "@/server/errors/app-error";
import { buildAICurriculumContext } from "@/server/services/ai-context.service";
import * as aiService from "@/server/services/ai.service";
import {
  AICurriculumContextSchema,
  AssessmentsSuggestionSchema,
  ClosureSuggestionSchema,
  DifferentiationSuggestionSchema,
  EssentialQuestionsSuggestionSchema,
  FullLessonDraftSuggestionSchema,
  LessonActivitiesSuggestionSchema,
  PedagogicalStrategiesSuggestionSchema,
} from "@/lib/validation/ai.schema";
import { createDraftPlanner, updatePlannerDraft } from "@/server/repositories/planner.repository";

/**
 * Verifies the AI provider abstraction (architecture only — no real
 * generation exists yet): curriculum context resolves correctly from the
 * real curriculum database, every service method fails safely with
 * AIUnavailableError while no provider is configured, and the Zod output
 * schemas structurally reject anything that looks like a curriculum edit
 * or an out-of-place CLOSURE row.
 *
 *   npx tsx scripts/test-ai-architecture.ts
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

async function expectAppError(
  fn: () => Promise<unknown>,
  expectedCode: string,
  message: string,
): Promise<void> {
  try {
    await fn();
    failed++;
    console.error(`  FAIL - ${message} (did not throw)`);
  } catch (error) {
    if (error instanceof AppError && error.code === expectedCode) {
      passed++;
      console.log(`  ok - ${message}`);
    } else {
      failed++;
      console.error(
        `  FAIL - ${message} (threw ${error instanceof AppError ? error.code : String(error)}, expected ${expectedCode})`,
      );
    }
  }
}

async function main() {
  const teacher = await prisma.teacherProfile.findFirstOrThrow({
    where: { user: { email: "demo.teacher@example.edu.gh" } },
  });
  const indicator = await prisma.learningIndicator.findFirstOrThrow({
    where: { code: "COMP-F1-STR-01-SS-01-CS-01-LI-01" },
  });

  console.log("1) buildAICurriculumContext resolves real curriculum text, not ids");
  const context = await buildAICurriculumContext(indicator.id, 45, teacher.id);
  assert(context.subject === "Computing", "context.subject resolves to the real subject name");
  assert(context.classLevel === "SHS 1", "context.classLevel resolves to the real class level name");
  assert(context.strand.length > 0, "context.strand is populated");
  assert(context.subStrand.length > 0, "context.subStrand is populated");
  assert(context.contentStandard.length > 0, "context.contentStandard is populated");
  assert(context.learningOutcome.length > 0, "context.learningOutcome is populated");
  assert(context.learningIndicator.length > 0, "context.learningIndicator is populated");
  assert(context.durationMinutes === 45, "context.durationMinutes carries the lesson's planned duration");
  assert(
    AICurriculumContextSchema.safeParse(context).success,
    "the resolved context itself satisfies AICurriculumContextSchema",
  );
  assert(
    !("learningIndicatorId" in context) && !("contentStandardId" in context),
    "context carries curriculum TEXT only — no curriculum ids the AI could reference/edit",
  );

  console.log("2) buildAICurriculumContext rejects an unknown learning indicator");
  try {
    await buildAICurriculumContext("does-not-exist", 45, teacher.id);
    failed++;
    console.error("  FAIL - should have thrown NotFoundError");
  } catch (error) {
    assert(error instanceof AppError && error.code === "NOT_FOUND", "unknown indicator -> NotFoundError");
  }

  console.log("3) Every generate* method fails safely while no provider is configured (AI_PROVIDER=none)");
  const plannerId = await createDraftPlanner(teacher.id, "2025/2026");
  await updatePlannerDraft(plannerId, teacher.id, {
    learningIndicatorId: indicator.id,
    durationMinutes: 45,
  });

  await expectAppError(
    () => aiService.generateEssentialQuestions(plannerId, teacher.id),
    "AI_UNAVAILABLE",
    "generateEssentialQuestions -> AIUnavailableError",
  );
  await expectAppError(
    () => aiService.generatePedagogicalStrategies(plannerId, teacher.id),
    "AI_UNAVAILABLE",
    "generatePedagogicalStrategies -> AIUnavailableError",
  );
  await expectAppError(
    () => aiService.generateDifferentiation(plannerId, teacher.id),
    "AI_UNAVAILABLE",
    "generateDifferentiation -> AIUnavailableError",
  );
  await expectAppError(
    () => aiService.generateLessonActivities(plannerId, teacher.id),
    "AI_UNAVAILABLE",
    "generateLessonActivities -> AIUnavailableError",
  );
  await expectAppError(
    () => aiService.generateAssessments(plannerId, teacher.id),
    "AI_UNAVAILABLE",
    "generateAssessments -> AIUnavailableError",
  );
  await expectAppError(
    () => aiService.generateClosure(plannerId, teacher.id),
    "AI_UNAVAILABLE",
    "generateClosure -> AIUnavailableError",
  );
  await expectAppError(
    () => aiService.generateFullLessonDraft(plannerId, teacher.id),
    "AI_UNAVAILABLE",
    "generateFullLessonDraft -> AIUnavailableError",
  );

  console.log("4) A planner missing curriculum alignment is rejected before AI is even consulted");
  const bareplannerId = await createDraftPlanner(teacher.id, "2025/2026");
  await expectAppError(
    () => aiService.generateEssentialQuestions(bareplannerId, teacher.id),
    "VALIDATION_ERROR",
    "no learningIndicatorId set -> ValidationError (not AIUnavailableError)",
  );

  console.log("5) A bogus planner id is rejected as not-found");
  await expectAppError(
    () => aiService.generateEssentialQuestions("does-not-exist", teacher.id),
    "NOT_FOUND",
    "unknown planner id -> NotFoundError",
  );

  console.log("6) Output schemas reject anything shaped like a curriculum edit (.strict())");
  const questionsWithCurriculumId = EssentialQuestionsSuggestionSchema.safeParse({
    essentialQuestions: ["Why do computers use binary?"],
    contentStandardId: "trying-to-sneak-in-a-curriculum-edit",
  });
  assert(!questionsWithCurriculumId.success, "an extra curriculum-id field is REJECTED, not silently stripped");

  const activitiesWithNewStrand = LessonActivitiesSuggestionSchema.safeParse({
    lessonActivities: [
      {
        stage: "ACTIVITY",
        label: "Activity",
        sequence: 1,
        durationMinutes: 10,
        teacherActivity: "Explain",
        learnerActivity: "Listen",
      },
    ],
    newStrand: { name: "AI-invented strand" },
  });
  assert(!activitiesWithNewStrand.success, "an attempt to attach a new curriculum object is REJECTED");

  console.log("7) generateLessonActivities vs generateClosure responsibilities can't overlap");
  const activitiesIncludingClosure = LessonActivitiesSuggestionSchema.safeParse({
    lessonActivities: [
      {
        stage: "CLOSURE",
        label: "Lesson Closure",
        sequence: 1,
        durationMinutes: 5,
        teacherActivity: "Wrap up",
        learnerActivity: "Reflect",
      },
    ],
  });
  assert(
    !activitiesIncludingClosure.success,
    "generateLessonActivities' schema rejects a CLOSURE-stage row",
  );

  const validClosure = ClosureSuggestionSchema.safeParse({
    closure: {
      stage: "CLOSURE",
      label: "Lesson Closure",
      sequence: 1,
      durationMinutes: 5,
      teacherActivity: "Wrap up",
      learnerActivity: "Reflect",
    },
  });
  assert(validClosure.success, "generateClosure's schema accepts a well-formed CLOSURE row");

  console.log("8) generateFullLessonDraft requires a CLOSURE row among its activities");
  const draftWithoutClosure = FullLessonDraftSuggestionSchema.safeParse({
    essentialQuestions: ["Q1"],
    pedagogicalStrategies: ["Strategy 1"],
    differentiation: {
      mixedAbilityGrouping: "",
      scaffoldSupport: "",
      extensionChallenge: "",
      resourceAdaptation: "",
      learningTaskDifferentiation: "",
      teacherPeerSupport: "",
      additionalNotes: "",
    },
    lessonActivities: [
      {
        stage: "STARTER",
        label: "Starter",
        sequence: 1,
        durationMinutes: 5,
        teacherActivity: "Greet",
        learnerActivity: "Settle",
      },
    ],
    assessments: [{ dokLevel: "LEVEL_1", description: "Quick check", sequence: 1 }],
  });
  assert(!draftWithoutClosure.success, "a full draft missing a CLOSURE row is rejected");

  console.log("9) Sanity: the other output schemas accept well-formed suggestions");
  assert(
    PedagogicalStrategiesSuggestionSchema.safeParse({ pedagogicalStrategies: ["Think-Pair-Share"] })
      .success,
    "PedagogicalStrategiesSuggestionSchema accepts a well-formed suggestion",
  );
  assert(
    DifferentiationSuggestionSchema.safeParse({
      differentiation: {
        mixedAbilityGrouping: "Group by proficiency",
        scaffoldSupport: "",
        extensionChallenge: "",
        resourceAdaptation: "",
        learningTaskDifferentiation: "",
        teacherPeerSupport: "",
        additionalNotes: "",
      },
    }).success,
    "DifferentiationSuggestionSchema accepts a well-formed suggestion",
  );
  assert(
    AssessmentsSuggestionSchema.safeParse({
      assessments: [{ dokLevel: "LEVEL_2", description: "Convert 13 to binary", sequence: 1 }],
    }).success,
    "AssessmentsSuggestionSchema accepts a well-formed suggestion",
  );

  console.log(`\n${passed} passed, ${failed} failed`);

  await prisma.lessonPlanner.deleteMany({ where: { id: { in: [plannerId, bareplannerId] } } });

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

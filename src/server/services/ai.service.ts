import type { ZodType } from "zod";
import {
  AIInvalidOutputError,
  AIUnavailableError,
  NotFoundError,
  ValidationError,
} from "@/server/errors/app-error";
import {
  AssessmentsSuggestionSchema,
  ClosureSuggestionSchema,
  DifferentiationSuggestionSchema,
  EssentialQuestionsSuggestionSchema,
  FullLessonDraftSuggestionSchema,
  LessonActivitiesSuggestionSchema,
  PedagogicalExemplarsSuggestionSchema,
  PedagogicalStrategiesSuggestionSchema,
  TeachingLearningResourcesSuggestionSchema,
  type AIGenerationOptions,
  type AssessmentsSuggestion,
  type ClosureSuggestion,
  type DifferentiationSuggestion,
  type EssentialQuestionsSuggestion,
  type FullLessonDraftSuggestion,
  type LessonActivitiesSuggestion,
  type PedagogicalExemplarsSuggestion,
  type PedagogicalStrategiesSuggestion,
  type TeachingLearningResourcesSuggestion,
} from "@/lib/validation/ai.schema";
import { getPlannerDraft } from "@/server/repositories/planner.repository";
import { getAIProvider } from "@/server/ai/ai-provider.factory";
import type { AIProvider } from "@/server/ai/ai-provider.interface";
import { buildAICurriculumContext } from "./ai-context.service";

/**
 * The business-facing AI API — `generateEssentialQuestions`,
 * `generatePedagogicalStrategies`, `generateDifferentiation`,
 * `generateLessonActivities`, `generateAssessments`, `generateClosure`,
 * `generateFullLessonDraft`. This is the one surface the rest of the app
 * (routes, the wizard) is meant to call; it is the only thing standing
 * between a raw `AIProvider` response and the wizard — and, by extension,
 * the database. No route or repository function ever writes an
 * `AIProvider` response directly; everything passes through the
 * `.safeParse()` calls below first.
 *
 * Every method here:
 *  1. Loads the planner draft (ownership-checked via `teacherId`, exactly
 *     like every other planner service function) and reads its
 *     `learningIndicatorId` / `durationMinutes` — never accepts curriculum
 *     text or ids from the caller directly.
 *  2. Resolves `AICurriculumContext` from the curriculum database
 *     (`buildAICurriculumContext`) and requires it to be complete before
 *     asking AI for anything — "we don't know what to suggest for" is a
 *     validation error, not a guess.
 *  3. Refuses to run at all if no provider is enabled (`AIUnavailableError`,
 *     with `provider.getStatusMessage()` explaining why — e.g. a missing
 *     API key).
 *  4. Re-validates whatever the provider returns against the matching
 *     `lib/validation/ai.schema.ts` output schema (`AIInvalidOutputError`
 *     on failure) before it goes anywhere near the wizard. A provider is
 *     untrusted input, exactly like a request body — this holds even
 *     though the concrete `AnthropicAIProvider` already validates its own
 *     output too; defense in depth, not redundancy, since this layer is
 *     what protects the app against *any* current or future provider.
 *  5. Returns an `AISuggestionResult<T>` — the data is always labeled as
 *     a suggestion with its provenance, never handed back looking like
 *     confirmed planner content.
 */

export interface AISuggestionResult<T> {
  suggestion: T;
  meta: {
    provider: string;
    generatedAt: string;
  };
}

async function resolveContextForPlanner(
  plannerId: string,
  teacherId: string,
  options?: AIGenerationOptions,
): Promise<{ provider: AIProvider; context: Awaited<ReturnType<typeof buildAICurriculumContext>> }> {
  const draft = await getPlannerDraft(plannerId, teacherId);
  if (!draft) {
    throw new NotFoundError("Planner draft not found.");
  }
  if (!draft.learningIndicatorId) {
    throw new ValidationError(
      "Select a Learning Indicator (Step 2) before requesting AI suggestions.",
    );
  }
  if (!draft.durationMinutes) {
    throw new ValidationError(
      "Set the lesson duration (Step 1) before requesting AI suggestions.",
    );
  }

  const provider = await getAIProvider();
  if (!provider.isEnabled()) {
    throw new AIUnavailableError(provider.getStatusMessage(), { category: "AI_CONFIGURATION_ERROR" });
  }

  const context = await buildAICurriculumContext(
    draft.learningIndicatorId,
    draft.durationMinutes,
    teacherId,
    options?.reflectionSourceLessonId,
  );
  return { provider, context };
}

function wrap<T>(provider: AIProvider, suggestion: T): AISuggestionResult<T> {
  return {
    suggestion,
    meta: { provider: provider.name, generatedAt: new Date().toISOString() },
  };
}

/** Re-validates a provider's raw response; never lets it through unparsed. */
function validateOrThrow<T>(schema: ZodType<T>, raw: unknown, label: string): T {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    throw new AIInvalidOutputError(`AI provider returned an invalid ${label} suggestion.`, {
      cause: parsed.error,
    });
  }
  return parsed.data;
}

export async function generateEssentialQuestions(
  plannerId: string,
  teacherId: string,
  options?: AIGenerationOptions,
): Promise<AISuggestionResult<EssentialQuestionsSuggestion>> {
  const { provider, context } = await resolveContextForPlanner(plannerId, teacherId, options);
  const raw = await provider.generateEssentialQuestions(context, options);
  return wrap(provider, validateOrThrow(EssentialQuestionsSuggestionSchema, raw, "essential-questions"));
}

export async function generatePedagogicalStrategies(
  plannerId: string,
  teacherId: string,
  options?: AIGenerationOptions,
): Promise<AISuggestionResult<PedagogicalStrategiesSuggestion>> {
  const { provider, context } = await resolveContextForPlanner(plannerId, teacherId, options);
  const raw = await provider.generatePedagogicalStrategies(context, options);
  return wrap(
    provider,
    validateOrThrow(PedagogicalStrategiesSuggestionSchema, raw, "pedagogical-strategies"),
  );
}

export async function generateTeachingLearningResources(
  plannerId: string,
  teacherId: string,
  options?: AIGenerationOptions,
): Promise<AISuggestionResult<TeachingLearningResourcesSuggestion>> {
  const { provider, context } = await resolveContextForPlanner(plannerId, teacherId, options);
  const raw = await provider.generateTeachingLearningResources(context, options);
  return wrap(
    provider,
    validateOrThrow(TeachingLearningResourcesSuggestionSchema, raw, "teaching-learning-resources"),
  );
}

export async function generateDifferentiation(
  plannerId: string,
  teacherId: string,
  options?: AIGenerationOptions,
): Promise<AISuggestionResult<DifferentiationSuggestion>> {
  const { provider, context } = await resolveContextForPlanner(plannerId, teacherId, options);
  const raw = await provider.generateDifferentiation(context);
  return wrap(provider, validateOrThrow(DifferentiationSuggestionSchema, raw, "differentiation"));
}

export async function generatePedagogicalExemplars(
  plannerId: string,
  teacherId: string,
  options?: AIGenerationOptions,
): Promise<AISuggestionResult<PedagogicalExemplarsSuggestion>> {
  const { provider, context } = await resolveContextForPlanner(plannerId, teacherId, options);
  const raw = await provider.generatePedagogicalExemplars(context, options);
  return wrap(
    provider,
    validateOrThrow(PedagogicalExemplarsSuggestionSchema, raw, "pedagogical-exemplars"),
  );
}

export async function generateLessonActivities(
  plannerId: string,
  teacherId: string,
  options?: AIGenerationOptions,
): Promise<AISuggestionResult<LessonActivitiesSuggestion>> {
  const { provider, context } = await resolveContextForPlanner(plannerId, teacherId, options);
  const raw = await provider.generateLessonActivities(context, options);
  return wrap(
    provider,
    validateOrThrow(LessonActivitiesSuggestionSchema, raw, "lesson-activities"),
  );
}

export async function generateAssessments(
  plannerId: string,
  teacherId: string,
  options?: AIGenerationOptions,
): Promise<AISuggestionResult<AssessmentsSuggestion>> {
  const { provider, context } = await resolveContextForPlanner(plannerId, teacherId, options);
  const raw = await provider.generateAssessments(context, options);
  return wrap(provider, validateOrThrow(AssessmentsSuggestionSchema, raw, "assessments"));
}

export async function generateClosure(
  plannerId: string,
  teacherId: string,
  options?: AIGenerationOptions,
): Promise<AISuggestionResult<ClosureSuggestion>> {
  const { provider, context } = await resolveContextForPlanner(plannerId, teacherId, options);
  const raw = await provider.generateClosure(context);
  return wrap(provider, validateOrThrow(ClosureSuggestionSchema, raw, "closure"));
}

export async function generateFullLessonDraft(
  plannerId: string,
  teacherId: string,
  options?: AIGenerationOptions,
): Promise<AISuggestionResult<FullLessonDraftSuggestion>> {
  const { provider, context } = await resolveContextForPlanner(plannerId, teacherId, options);
  const raw = await provider.generateFullLessonDraft(context);
  return wrap(
    provider,
    validateOrThrow(FullLessonDraftSuggestionSchema, raw, "full-lesson-draft"),
  );
}

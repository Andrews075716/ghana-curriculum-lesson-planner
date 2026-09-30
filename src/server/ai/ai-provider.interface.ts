import type {
  AICurriculumContext,
  AIGenerationOptions,
  AssessmentsSuggestion,
  ClosureSuggestion,
  DifferentiationSuggestion,
  EssentialQuestionsSuggestion,
  FullLessonDraftSuggestion,
  LessonActivitiesSuggestion,
  PedagogicalExemplarsSuggestion,
  PedagogicalStrategiesSuggestion,
  TeachingLearningResourcesSuggestion,
} from "@/lib/validation/ai.schema";

export type {
  AICurriculumContext,
  AIGenerationOptions,
  AssessmentsSuggestion,
  ClosureSuggestion,
  DifferentiationSuggestion,
  EssentialQuestionsSuggestion,
  FullLessonDraftSuggestion,
  LessonActivitiesSuggestion,
  PedagogicalExemplarsSuggestion,
  PedagogicalStrategiesSuggestion,
  TeachingLearningResourcesSuggestion,
};

/**
 * Provider-agnostic contract for AI-assisted lesson content. This is the
 * one place a concrete AI vendor (OpenAI, Anthropic, a local model, ...)
 * touches the app — everything else (services, routes, the wizard) talks
 * to `AIProvider`, never to a vendor SDK directly, so swapping providers
 * never means touching business logic.
 *
 * Ground rules that apply to every method here, enforced structurally by
 * the types and by `server/services/ai.service.ts` validating every
 * response against `lib/validation/ai.schema.ts` before it reaches the
 * rest of the app:
 *
 *  - A provider RECEIVES curriculum context; it never receives write
 *    access to curriculum data and has no method that could create or
 *    alter a Subject/Strand/ContentStandard/LearningOutcome/
 *    LearningIndicator. Curriculum data is read-only input here, full
 *    stop.
 *  - Every return value is a SUGGESTION — plain lesson-content data
 *    (questions, strategies, activities, assessments) in exactly the
 *    shape a teacher could have typed by hand. Nothing a provider returns
 *    is persisted directly; it always lands in wizard state for a teacher
 *    to review, edit, or discard first (see ai.service.ts).
 *  - Implementations must be pure request/response: no direct database
 *    access. `AICurriculumContext` is resolved from the curriculum
 *    database by the caller (`ai-context.service.ts`) before a provider
 *    ever sees it.
 */
export interface AIProvider {
  /** Name for logging/telemetry and for the `meta.provider` field on results. */
  readonly name: string;

  /** Whether this provider is actually configured/usable right now. */
  isEnabled(): boolean;

  /**
   * Human-readable explanation of the current status — why it's disabled
   * (e.g. a missing API key) when `isEnabled()` is false, or a short
   * confirmation (e.g. which model) when it's true. Surfaced in
   * `AIUnavailableError` messages so "AI isn't working" has an actionable
   * reason instead of a generic failure.
   */
  getStatusMessage(): string;

  generateEssentialQuestions(
    context: AICurriculumContext,
    options?: AIGenerationOptions,
  ): Promise<EssentialQuestionsSuggestion>;

  generatePedagogicalStrategies(
    context: AICurriculumContext,
    options?: AIGenerationOptions,
  ): Promise<PedagogicalStrategiesSuggestion>;

  generateTeachingLearningResources(
    context: AICurriculumContext,
    options?: AIGenerationOptions,
  ): Promise<TeachingLearningResourcesSuggestion>;

  generateDifferentiation(context: AICurriculumContext): Promise<DifferentiationSuggestion>;

  generatePedagogicalExemplars(
    context: AICurriculumContext,
    options?: AIGenerationOptions,
  ): Promise<PedagogicalExemplarsSuggestion>;

  /**
   * The "main" lesson flow (Starter/Introductory/Activity/Assessment
   * stages) — excludes Lesson Closure, which `generateClosure` owns.
   */
  generateLessonActivities(
    context: AICurriculumContext,
    options?: AIGenerationOptions,
  ): Promise<LessonActivitiesSuggestion>;

  generateAssessments(
    context: AICurriculumContext,
    options?: AIGenerationOptions,
  ): Promise<AssessmentsSuggestion>;

  generateClosure(context: AICurriculumContext): Promise<ClosureSuggestion>;

  /** One coherent draft covering everything the other methods cover, generated together for coherence. */
  generateFullLessonDraft(context: AICurriculumContext): Promise<FullLessonDraftSuggestion>;
}

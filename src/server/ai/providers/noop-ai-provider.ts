import type {
  AICurriculumContext,
  AIProvider,
  AssessmentsSuggestion,
  ClosureSuggestion,
  DifferentiationSuggestion,
  EssentialQuestionsSuggestion,
  FullLessonDraftSuggestion,
  LessonActivitiesSuggestion,
  PedagogicalExemplarsSuggestion,
  PedagogicalStrategiesSuggestion,
  TeachingLearningResourcesSuggestion,
} from "../ai-provider.interface";

/**
 * Default/fallback provider while no real AI provider is configured
 * (`AI_PROVIDER=none`, the default — see .env.example). `isEnabled()`
 * returns false, which `ai.service.ts` treats as "AI assistance isn't
 * available" and refuses to call any of the methods below — they exist
 * only to satisfy the interface, and are never expected to run.
 */
export class NoopAIProvider implements AIProvider {
  readonly name = "noop";

  isEnabled(): boolean {
    return false;
  }

  getStatusMessage(): string {
    return 'No AI provider is configured (AI_PROVIDER is "none" or unset).';
  }

  async generateEssentialQuestions(
    _context: AICurriculumContext,
  ): Promise<EssentialQuestionsSuggestion> {
    return { essentialQuestions: [] };
  }

  async generatePedagogicalStrategies(
    _context: AICurriculumContext,
  ): Promise<PedagogicalStrategiesSuggestion> {
    return { pedagogicalStrategies: [] };
  }

  async generateTeachingLearningResources(
    _context: AICurriculumContext,
  ): Promise<TeachingLearningResourcesSuggestion> {
    return { teachingLearningResources: [] };
  }

  async generateDifferentiation(_context: AICurriculumContext): Promise<DifferentiationSuggestion> {
    return {
      differentiation: {
        mixedAbilityGrouping: "",
        scaffoldSupport: "",
        extensionChallenge: "",
        resourceAdaptation: "",
        learningTaskDifferentiation: "",
        teacherPeerSupport: "",
        additionalNotes: "",
      },
    };
  }

  async generatePedagogicalExemplars(
    _context: AICurriculumContext,
  ): Promise<PedagogicalExemplarsSuggestion> {
    return { pedagogicalExemplars: [] };
  }

  async generateLessonActivities(
    _context: AICurriculumContext,
  ): Promise<LessonActivitiesSuggestion> {
    return { lessonActivities: [] };
  }

  async generateAssessments(_context: AICurriculumContext): Promise<AssessmentsSuggestion> {
    return { assessments: [] };
  }

  async generateClosure(_context: AICurriculumContext): Promise<ClosureSuggestion> {
    throw new Error("NoopAIProvider cannot generate a closure — AI assistance is disabled.");
  }

  async generateFullLessonDraft(
    _context: AICurriculumContext,
  ): Promise<FullLessonDraftSuggestion> {
    throw new Error("NoopAIProvider cannot generate a lesson draft — AI assistance is disabled.");
  }
}

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
 * Deterministic, zero-cost `AIProvider` for tests — NOT a vendor
 * integration. Exists specifically so tests can exercise the REAL
 * `ai.service.ts` pipeline (schema validation, then semantic duration
 * validation — see `lesson-duration-validation.service.ts`) without a live
 * Anthropic call. Selected only via `AI_PROVIDER=mock`, and
 * `ai-provider.factory.ts` refuses to select it when `NODE_ENV=production`
 * (falls back to `NoopAIProvider` instead) so a misconfigured production
 * `.env` can never silently serve canned fake lesson content to a teacher.
 *
 * Every timed method returns activities whose durations are FIXED,
 * independent of `context.durationMinutes` — that's deliberate: it lets a
 * test control pass/fail by choosing the planner's `durationMinutes` when
 * setting up its fixture (e.g. 40 to match `generateLessonActivities`'
 * fixed 40-minute total exactly, or 30 to force an over-allocation), rather
 * than needing a configuration mechanism of its own.
 */
export class MockAIProvider implements AIProvider {
  readonly name = "mock";

  isEnabled(): boolean {
    return true;
  }

  getStatusMessage(): string {
    return "Mock provider (test-only, deterministic, zero-cost).";
  }

  async generateEssentialQuestions(_context: AICurriculumContext): Promise<EssentialQuestionsSuggestion> {
    return { essentialQuestions: ["Why does this matter?"] };
  }

  async generatePedagogicalStrategies(_context: AICurriculumContext): Promise<PedagogicalStrategiesSuggestion> {
    return { pedagogicalStrategies: ["Think-Pair-Share"] };
  }

  async generateTeachingLearningResources(
    _context: AICurriculumContext,
  ): Promise<TeachingLearningResourcesSuggestion> {
    return { teachingLearningResources: ["Whiteboard"] };
  }

  async generateDifferentiation(_context: AICurriculumContext): Promise<DifferentiationSuggestion> {
    return {
      differentiation: {
        mixedAbilityGrouping: "Group by proficiency",
        scaffoldSupport: "",
        extensionChallenge: "",
        resourceAdaptation: "",
        learningTaskDifferentiation: "",
        teacherPeerSupport: "",
        additionalNotes: "",
      },
    };
  }

  async generatePedagogicalExemplars(_context: AICurriculumContext): Promise<PedagogicalExemplarsSuggestion> {
    return { pedagogicalExemplars: ["Worked example"] };
  }

  /** Fixed 40-minute total (20 + 20), two ACTIVITY-stage rows. */
  async generateLessonActivities(_context: AICurriculumContext): Promise<LessonActivitiesSuggestion> {
    return {
      lessonActivities: [
        {
          stage: "STARTER",
          label: "Starter",
          sequence: 1,
          durationMinutes: 20,
          teacherActivity: "Introduce the topic.",
          learnerActivity: "Discuss prior knowledge.",
        },
        {
          stage: "ACTIVITY",
          label: "Main activity",
          sequence: 2,
          durationMinutes: 20,
          teacherActivity: "Lead the main task.",
          learnerActivity: "Complete the main task.",
        },
      ],
    };
  }

  async generateAssessments(_context: AICurriculumContext): Promise<AssessmentsSuggestion> {
    return { assessments: [{ dokLevel: "LEVEL_1", description: "Quick check", sequence: 1 }] };
  }

  /** Fixed 10-minute closure. */
  async generateClosure(_context: AICurriculumContext): Promise<ClosureSuggestion> {
    return {
      closure: {
        stage: "CLOSURE",
        label: "Lesson Closure",
        sequence: 1,
        durationMinutes: 10,
        teacherActivity: "Summarize the lesson.",
        learnerActivity: "Answer recap questions.",
      },
    };
  }

  /** Fixed 50-minute total across activities (40 main + 10 closure), matching the two methods above. */
  async generateFullLessonDraft(_context: AICurriculumContext): Promise<FullLessonDraftSuggestion> {
    const { lessonActivities: main } = await this.generateLessonActivities(_context);
    const { closure } = await this.generateClosure(_context);
    return {
      essentialQuestions: ["Why does this matter?"],
      pedagogicalStrategies: ["Think-Pair-Share"],
      differentiation: {
        mixedAbilityGrouping: "Group by proficiency",
        scaffoldSupport: "",
        extensionChallenge: "",
        resourceAdaptation: "",
        learningTaskDifferentiation: "",
        teacherPeerSupport: "",
        additionalNotes: "",
      },
      lessonActivities: [...main, closure],
      assessments: [{ dokLevel: "LEVEL_1", description: "Quick check", sequence: 1 }],
    };
  }
}

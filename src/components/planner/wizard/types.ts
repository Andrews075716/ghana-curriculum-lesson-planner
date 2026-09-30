import type { DokLevel, LessonActivityStage, Term } from "@prisma/client";
import type {
  AssessmentInput,
  LessonActivityInput,
  PlannerDraftUpdate,
} from "@/lib/validation/planner.schema";
import { DEFAULT_LESSON_ACTIVITY_STAGES } from "@/lib/constants/planner-wizard";

export interface LessonActivityDraft {
  key: string;
  stage: LessonActivityStage;
  label: string;
  durationMinutes: string;
  teacherActivity: string;
  learnerActivity: string;
}

export interface AssessmentDraft {
  key: string;
  dokLevel: DokLevel | "";
  description: string;
}

export interface CrossCuttingThemeDraft {
  themeId: string;
  explanation: string;
}

/** Differentiation is 7 distinct planning dimensions, never a single note or checkbox. */
export interface DifferentiationDraft {
  mixedAbilityGrouping: string;
  scaffoldSupport: string;
  extensionChallenge: string;
  resourceAdaptation: string;
  learningTaskDifferentiation: string;
  teacherPeerSupport: string;
  additionalNotes: string;
}

export const EMPTY_DIFFERENTIATION: DifferentiationDraft = {
  mixedAbilityGrouping: "",
  scaffoldSupport: "",
  extensionChallenge: "",
  resourceAdaptation: "",
  learningTaskDifferentiation: "",
  teacherPeerSupport: "",
  additionalNotes: "",
};

export interface WizardState {
  // Step 1 — Basic Information
  subjectId: string;
  classLevelId: string;
  classLevelLabel: string;
  term: Term | "";
  weekNumber: string;
  lessonNumber: string;
  lessonDate: string;
  durationMinutes: string;
  /** Optional: a previous lesson whose reflection the teacher has chosen to share as AI context. Never persisted server-side, never causes that lesson to change. */
  reflectionContextLessonId: string | null;

  // Step 2 — Curriculum Alignment
  strandId: string;
  subStrandId: string;
  contentStandardId: string;
  learningOutcomeId: string;
  learningIndicatorId: string;

  // Step 3 — Planning
  essentialQuestions: string[];
  crossCuttingThemes: CrossCuttingThemeDraft[];
  pedagogicalStrategies: string[];
  teachingLearningResources: string[];
  keywords: string[];

  // Step 4 — Differentiation & Pedagogy
  differentiation: DifferentiationDraft;
  learningTasks: string[];
  pedagogicalExemplars: string[];

  // Step 5 — Main Lesson (includes Assessment- and Closure-stage rows too)
  lessonActivities: LessonActivityDraft[];

  // Step 6 — Assessment
  assessments: AssessmentDraft[];
}

/** The 6 default lesson-flow rows a brand-new wizard starts from. */
function createDefaultLessonActivities(): LessonActivityDraft[] {
  return DEFAULT_LESSON_ACTIVITY_STAGES.map(({ stage, label }) => ({
    key: crypto.randomUUID(),
    stage,
    label,
    durationMinutes: "",
    teacherActivity: "",
    learnerActivity: "",
  }));
}

export function createInitialWizardState(): WizardState {
  return {
    subjectId: "",
    classLevelId: "",
    classLevelLabel: "",
    term: "",
    weekNumber: "",
    lessonNumber: "1",
    lessonDate: "",
    durationMinutes: "",
    reflectionContextLessonId: null,
    strandId: "",
    subStrandId: "",
    contentStandardId: "",
    learningOutcomeId: "",
    learningIndicatorId: "",
    essentialQuestions: [],
    crossCuttingThemes: [],
    pedagogicalStrategies: [],
    teachingLearningResources: [],
    keywords: [],
    differentiation: { ...EMPTY_DIFFERENTIATION },
    learningTasks: [],
    pedagogicalExemplars: [],
    lessonActivities: createDefaultLessonActivities(),
    assessments: [],
  };
}

/** Converts a validated AI suggestion (or persisted draft data) into editable wizard-state rows. */
export function toLessonActivityDraft(input: LessonActivityInput): LessonActivityDraft {
  return {
    key: crypto.randomUUID(),
    stage: input.stage,
    label: input.label,
    durationMinutes: String(input.durationMinutes),
    teacherActivity: input.teacherActivity,
    learnerActivity: input.learnerActivity,
  };
}

export function toAssessmentDraft(input: AssessmentInput): AssessmentDraft {
  return {
    key: crypto.randomUUID(),
    dokLevel: input.dokLevel,
    description: input.description,
  };
}

function toInt(value: string): number | undefined {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && value.trim() !== "" ? parsed : undefined;
}

/** Builds the autosave PATCH payload from the current wizard state. */
export function buildDraftUpdatePayload(state: WizardState): PlannerDraftUpdate {
  return {
    classSection: state.classLevelLabel || null,
    term: state.term || null,
    weekNumber: toInt(state.weekNumber) ?? null,
    lessonNumber: toInt(state.lessonNumber) ?? 1,
    lessonDate: state.lessonDate || null,
    durationMinutes: toInt(state.durationMinutes) ?? null,
    learningIndicatorId: state.learningIndicatorId || null,
    essentialQuestions: state.essentialQuestions,
    crossCuttingThemes: state.crossCuttingThemes.map(({ themeId, explanation }) => ({
      themeId,
      explanation: explanation.trim(),
    })),
    pedagogicalStrategies: state.pedagogicalStrategies,
    teachingLearningResources: state.teachingLearningResources,
    keywords: state.keywords,
    differentiation: {
      mixedAbilityGrouping: state.differentiation.mixedAbilityGrouping.trim(),
      scaffoldSupport: state.differentiation.scaffoldSupport.trim(),
      extensionChallenge: state.differentiation.extensionChallenge.trim(),
      resourceAdaptation: state.differentiation.resourceAdaptation.trim(),
      learningTaskDifferentiation: state.differentiation.learningTaskDifferentiation.trim(),
      teacherPeerSupport: state.differentiation.teacherPeerSupport.trim(),
      additionalNotes: state.differentiation.additionalNotes.trim(),
    },
    learningTasks: state.learningTasks,
    pedagogicalExemplars: state.pedagogicalExemplars,
    lessonActivities: state.lessonActivities
      .filter((a) => a.label.trim() && a.teacherActivity.trim() && a.learnerActivity.trim())
      .map((a, index) => ({
        stage: a.stage,
        label: a.label.trim(),
        sequence: index + 1,
        durationMinutes: toInt(a.durationMinutes) ?? 1,
        teacherActivity: a.teacherActivity.trim(),
        learnerActivity: a.learnerActivity.trim(),
      })),
    assessments: state.assessments
      .filter((a) => a.dokLevel && a.description.trim())
      .map((a, index) => ({
        dokLevel: a.dokLevel as DokLevel,
        description: a.description.trim(),
        sequence: index + 1,
      })),
  };
}

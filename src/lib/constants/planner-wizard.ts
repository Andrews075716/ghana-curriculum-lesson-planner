export interface WizardStepDef {
  id: number;
  label: string;
  shortLabel: string;
}

export const WIZARD_STEPS: WizardStepDef[] = [
  { id: 1, label: "Basic Information", shortLabel: "Basics" },
  { id: 2, label: "Curriculum Alignment", shortLabel: "Curriculum" },
  { id: 3, label: "Planning", shortLabel: "Planning" },
  { id: 4, label: "Differentiation & Pedagogy", shortLabel: "Differentiation" },
  { id: 5, label: "Main Lesson", shortLabel: "Lesson" },
  { id: 6, label: "Assessment", shortLabel: "Assessment" },
  { id: 7, label: "Review & Save", shortLabel: "Review" },
];

export const TERM_OPTIONS = [
  { value: "TERM_1", label: "Term 1" },
  { value: "TERM_2", label: "Term 2" },
  { value: "TERM_3", label: "Term 3" },
] as const;

export const DOK_LEVEL_OPTIONS = [
  { value: "LEVEL_1", label: "Level 1 — Recall" },
  { value: "LEVEL_2", label: "Level 2 — Skill/Concept" },
  { value: "LEVEL_3", label: "Level 3 — Strategic Thinking" },
  { value: "LEVEL_4", label: "Level 4 — Extended Thinking" },
] as const;

export const LESSON_ACTIVITY_STAGE_OPTIONS = [
  { value: "STARTER", label: "Starter" },
  { value: "INTRODUCTORY", label: "Introduction" },
  { value: "ACTIVITY", label: "Activity" },
  { value: "ASSESSMENT", label: "Assessment" },
  { value: "CLOSURE", label: "Lesson Closure" },
] as const;

/** Seeded into a brand-new wizard's Main Lesson step so teachers start from the standard lesson flow. */
export const DEFAULT_LESSON_ACTIVITY_STAGES = [
  { stage: "STARTER", label: "Starter" },
  { stage: "INTRODUCTORY", label: "Introduction" },
  { stage: "ACTIVITY", label: "Activity 1" },
  { stage: "ACTIVITY", label: "Activity 2" },
  { stage: "ASSESSMENT", label: "Assessment" },
  { stage: "CLOSURE", label: "Lesson Closure" },
] as const;

/**
 * The 7 independent differentiation dimensions — shared between the wizard's
 * editor, the review step, and the print preview so the labels never drift.
 */
export const DIFFERENTIATION_FIELDS = [
  {
    key: "mixedAbilityGrouping",
    label: "Mixed-Ability Grouping",
    placeholder: "e.g. Group learners of varying ability together for the activity",
  },
  {
    key: "scaffoldSupport",
    label: "Scaffold / Support",
    placeholder: "e.g. Provide sentence starters and worked examples for struggling learners",
  },
  {
    key: "extensionChallenge",
    label: "Extension / Challenge",
    placeholder: "e.g. Ask advanced learners to convert larger binary numbers",
  },
  {
    key: "resourceAdaptation",
    label: "Resource Adaptation",
    placeholder: "e.g. Provide enlarged print materials for learners with visual impairment",
  },
  {
    key: "learningTaskDifferentiation",
    label: "Learning Task Differentiation",
    placeholder: "e.g. Vary the number and complexity of practice items by group",
  },
  {
    key: "teacherPeerSupport",
    label: "Teacher / Peer Support",
    placeholder: "e.g. Pair learners for peer tutoring; teacher circulates to the weakest group first",
  },
  {
    key: "additionalNotes",
    label: "Additional Notes",
    placeholder: "Any other differentiation considerations for this lesson",
  },
] as const;

import { z } from "zod";

/**
 * Shared field-level primitives, plus a schema per wizard step and a strict
 * "ready to publish" schema. Autosave uses the lenient per-field shapes
 * (`PlannerDraftUpdateSchema`) so partial, in-progress data always
 * round-trips; only `PlannerPublishSchema` enforces full completeness.
 */

const nonEmptyTrimmed = z.string().trim().min(1);
const stringListSchema = z.array(nonEmptyTrimmed.max(1000)).max(50);
// For step schemas only, where "field absent" should mean "empty list".
// NOT used in PlannerDraftUpdateSchema: chaining `.optional()` after
// `.default([])` does not suppress the default in Zod — a genuinely
// absent key would still be substituted with `[]`, which is wrong for a
// partial-update payload where "absent" must mean "don't touch this field".
const optionalListOfStrings = stringListSchema.default([]);

export const DokLevelSchema = z.enum(["LEVEL_1", "LEVEL_2", "LEVEL_3", "LEVEL_4"]);
export const TermSchema = z.enum(["TERM_1", "TERM_2", "TERM_3"]);
export const LessonActivityStageSchema = z.enum([
  "STARTER",
  "INTRODUCTORY",
  "ACTIVITY",
  "ASSESSMENT",
  "CLOSURE",
]);

// --- Step 1: Basic Information ---------------------------------------

export const Step1Schema = z.object({
  subjectId: nonEmptyTrimmed,
  classLevelId: nonEmptyTrimmed,
  term: TermSchema,
  weekNumber: z.number().int().min(1).max(52),
  lessonNumber: z.number().int().min(1).max(20),
  lessonDate: z.string().date().optional().nullable(),
  durationMinutes: z.number().int().min(1).max(600),
});
export type Step1Data = z.infer<typeof Step1Schema>;

// --- Step 2: Curriculum Alignment --------------------------------------

export const Step2Schema = z.object({
  strandId: nonEmptyTrimmed,
  subStrandId: nonEmptyTrimmed,
  contentStandardId: nonEmptyTrimmed,
  learningOutcomeId: nonEmptyTrimmed,
  learningIndicatorId: nonEmptyTrimmed,
});
export type Step2Data = z.infer<typeof Step2Schema>;

// --- Step 3: Planning (lenient — supplementary content) ----------------

// A cross-cutting theme is a selection PLUS an explanation of how it's
// incorporated — never just a checked box.
export const CrossCuttingThemeSelectionSchema = z.object({
  themeId: nonEmptyTrimmed,
  explanation: z.string().trim().max(1000),
});
export type CrossCuttingThemeSelection = z.infer<typeof CrossCuttingThemeSelectionSchema>;

export const Step3Schema = z.object({
  essentialQuestions: optionalListOfStrings,
  crossCuttingThemes: z.array(CrossCuttingThemeSelectionSchema).max(20).default([]),
  pedagogicalStrategies: optionalListOfStrings,
  teachingLearningResources: optionalListOfStrings,
  keywords: optionalListOfStrings,
});
export type Step3Data = z.infer<typeof Step3Schema>;

// --- Step 4: Differentiation & Pedagogy ---------------------------------
//
// Differentiation is deliberately 7 separate fields, not one free-text note
// or a single checkbox — each dimension is planned independently.

const differentiationField = z.string().trim().max(2000);

export const DifferentiationPlanSchema = z.object({
  mixedAbilityGrouping: differentiationField,
  scaffoldSupport: differentiationField,
  extensionChallenge: differentiationField,
  resourceAdaptation: differentiationField,
  learningTaskDifferentiation: differentiationField,
  teacherPeerSupport: differentiationField,
  additionalNotes: differentiationField,
});
export type DifferentiationPlanInput = z.infer<typeof DifferentiationPlanSchema>;

export const Step4Schema = z.object({
  differentiation: DifferentiationPlanSchema,
  learningTasks: optionalListOfStrings,
  pedagogicalExemplars: optionalListOfStrings,
});
export type Step4Data = z.infer<typeof Step4Schema>;

// --- Step 5: Main Lesson -------------------------------------------------

export const LessonActivityInputSchema = z.object({
  stage: LessonActivityStageSchema,
  label: nonEmptyTrimmed.max(120),
  sequence: z.number().int().min(1),
  durationMinutes: z.number().int().min(1).max(300),
  teacherActivity: nonEmptyTrimmed.max(4000),
  learnerActivity: nonEmptyTrimmed.max(4000),
});
export type LessonActivityInput = z.infer<typeof LessonActivityInputSchema>;

export const Step5Schema = z.object({
  lessonActivities: z.array(LessonActivityInputSchema).max(20).default([]),
});
export type Step5Data = z.infer<typeof Step5Schema>;

// --- Step 6: Assessment ---------------------------------------------------
//
// Lesson Closure is no longer a separate concept here — it's just another
// row in `lessonActivities` with stage "CLOSURE", edited alongside the rest
// of the lesson flow in the unified Main Lesson editor (Step 5).

export const AssessmentInputSchema = z.object({
  dokLevel: DokLevelSchema,
  description: nonEmptyTrimmed.max(2000),
  sequence: z.number().int().min(1),
});
export type AssessmentInput = z.infer<typeof AssessmentInputSchema>;

export const Step6Schema = z.object({
  assessments: z.array(AssessmentInputSchema).max(20).default([]),
});
export type Step6Data = z.infer<typeof Step6Schema>;

// --- Full draft update payload (autosave) -------------------------------
//
// Every field optional: autosave sends whatever the client currently has,
// and the service only touches fields that are present.

export const PlannerDraftUpdateSchema = z.object({
  // Step 1 — subjectId/classLevelId are client-side gating values only
  // (there's no FK for them on LessonPlanner); the resolved Form/Class
  // label is what's actually persisted, matching the `classSection` column.
  classSection: nonEmptyTrimmed.nullable().optional(),
  term: TermSchema.nullable().optional(),
  weekNumber: z.number().int().min(1).max(52).nullable().optional(),
  lessonNumber: z.number().int().min(1).max(20).optional(),
  lessonDate: z.string().date().nullable().optional(),
  durationMinutes: z.number().int().min(1).max(600).nullable().optional(),

  // Step 2
  learningIndicatorId: nonEmptyTrimmed.nullable().optional(),

  // Step 3
  essentialQuestions: stringListSchema.optional(),
  crossCuttingThemes: z.array(CrossCuttingThemeSelectionSchema).max(20).optional(),
  pedagogicalStrategies: stringListSchema.optional(),
  teachingLearningResources: stringListSchema.optional(),
  keywords: stringListSchema.optional(),

  // Step 4 — sent as one whole object, not a partial patch.
  differentiation: DifferentiationPlanSchema.optional(),
  learningTasks: stringListSchema.optional(),
  pedagogicalExemplars: stringListSchema.optional(),

  // Step 5 — includes Assessment- and Closure-stage rows too (a unified
  // lesson-flow list, not just the "main" teaching activities).
  lessonActivities: z.array(LessonActivityInputSchema).max(25).optional(),

  // Step 6
  assessments: z.array(AssessmentInputSchema).max(20).optional(),
});
export type PlannerDraftUpdate = z.infer<typeof PlannerDraftUpdateSchema>;

// --- Publish (strict — everything required) -----------------------------

export const PlannerPublishSchema = z.object({
  classSection: nonEmptyTrimmed,
  term: TermSchema,
  weekNumber: z.number().int().min(1).max(52),
  durationMinutes: z.number().int().min(1).max(600),
  learningIndicatorId: nonEmptyTrimmed,
  lessonActivities: z
    .array(LessonActivityInputSchema)
    .min(1)
    .refine((activities) => activities.some((a) => a.stage === "CLOSURE"), {
      message: "The lesson flow must include a Lesson Closure activity.",
    }),
  assessments: z.array(AssessmentInputSchema).min(1),
});
export type PlannerPublishData = z.infer<typeof PlannerPublishSchema>;

// --- List / search / filter (My Planners) -------------------------------

const PlannerStatusSchema = z.enum(["DRAFT", "PUBLISHED"]);

export const PlannerListQuerySchema = z.object({
  search: z.string().trim().max(200).optional(),
  subjectId: z.string().trim().min(1).optional(),
  classLevelId: z.string().trim().min(1).optional(),
  term: TermSchema.optional(),
  status: PlannerStatusSchema.optional(),
});
export type PlannerListQuery = z.infer<typeof PlannerListQuerySchema>;

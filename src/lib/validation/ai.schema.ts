import { z } from "zod";
import {
  AssessmentInputSchema,
  DifferentiationPlanSchema,
  LessonActivityInputSchema,
} from "./planner.schema";

/**
 * Schemas for the AI-assistance boundary (server/ai). Two directions:
 *
 *  - INPUT: `AICurriculumContextSchema` describes the read-only curriculum
 *    context every AI request must carry. It is built exclusively from
 *    `curriculum.repository.ts` — never accepted as free text from a
 *    client — so nothing here doubles as a way to inject or edit
 *    curriculum data.
 *
 *  - OUTPUT: one schema per `generate*` method, reusing the exact field
 *    schemas the wizard already uses for teacher-entered content
 *    (`LessonActivityInputSchema`, `AssessmentInputSchema`,
 *    `DifferentiationPlanSchema`). Reusing them is the enforcement
 *    mechanism: an AI response can only ever contain the same shape a
 *    teacher could type into the form by hand — no curriculum ids, no
 *    extra fields. Every output object schema is `.strict()`, so a
 *    provider response carrying anything beyond that shape (e.g. an
 *    attempt to smuggle a `contentStandardId` or "helpfully" invent a new
 *    curriculum field) fails validation instead of being silently
 *    stripped and accepted.
 */

const nonEmptyTrimmed = z.string().trim().min(1);

// --- Input: curriculum context -------------------------------------------

/**
 * Official Category B guidance NaCCA attaches to the Learning Outcome/
 * Learning Indicator (see `LearningOutcomeGuidance`/`LearningIndicatorGuidance`
 * in schema.prisma) — included when present so AI grounds GESI/SEL/21st
 * Century/National Values content and DoK-aligned assessment in what the
 * official curriculum actually says, rather than generating generic
 * versions of those from scratch. Every field optional/omittable: a
 * subject's guidance may not cover all of these.
 */
// Length limits below are based on actual measured content, not guesses:
// as of 2026-09-30 the longest real value for each field (across all 33
// imported subjects) is twentyFirstCenturySkills 4315, gesi 1518, sel 1363,
// a single nationalCoreValue 555, a single pedagogicalExemplar 2156, a
// single dokDescription 686 chars. Limits below add headroom above that
// measured maximum rather than an arbitrary round number.
const OfficialGuidanceSchema = z
  .object({
    twentyFirstCenturySkills: nonEmptyTrimmed.max(6000).optional(),
    gesi: nonEmptyTrimmed.max(2500).optional(),
    sel: nonEmptyTrimmed.max(2500).optional(),
    nationalCoreValues: z.array(nonEmptyTrimmed.max(1000)).max(20).optional(),
    pedagogicalExemplars: z.array(nonEmptyTrimmed.max(3000)).max(20).optional(),
    dokDescriptions: z.array(nonEmptyTrimmed.max(1000)).max(20).optional(),
  })
  .strict();

export const AICurriculumContextSchema = z
  .object({
    subject: nonEmptyTrimmed,
    classLevel: nonEmptyTrimmed,
    strand: nonEmptyTrimmed,
    subStrand: nonEmptyTrimmed,
    contentStandard: nonEmptyTrimmed,
    learningOutcome: nonEmptyTrimmed,
    learningIndicator: nonEmptyTrimmed,
    durationMinutes: z.number().int().min(1).max(600),
    /**
     * Text of any Content Standards ADDITIONALLY linked to this Learning
     * Outcome beyond the primary one above (see
     * `LearningOutcomeContentStandardLink`) — omitted entirely when there
     * are none, which is the common case.
     */
    additionalContentStandards: z.array(nonEmptyTrimmed.max(1000)).max(10).optional(),
    /** Official printed codes, text only — never a database id. */
    curriculumCodes: z
      .object({
        contentStandard: nonEmptyTrimmed.max(100).optional(),
        learningOutcome: nonEmptyTrimmed.max(100).optional(),
        learningIndicator: nonEmptyTrimmed.max(100).optional(),
      })
      .strict()
      .optional(),
    officialGuidance: OfficialGuidanceSchema.optional(),
    /** e.g. "NaCCA SHS September 2023" — source/version metadata, text only. */
    curriculumVersion: nonEmptyTrimmed.max(200).optional(),
    /**
     * Optional, teacher-opted-in text from a PREVIOUS lesson's post-lesson
     * reflection (see lesson.repository.ts), included only when the
     * teacher explicitly picks a source lesson. Informational only — it
     * never causes the source lesson to be read as anything other than
     * plain text, and this context is never written back anywhere.
     */
    previousLessonReflection: z.string().trim().max(4000).optional(),
  })
  .strict();
export type AICurriculumContext = z.infer<typeof AICurriculumContextSchema>;

/** Shared optional knobs for the generate* methods. */
export const AIGenerationOptionsSchema = z
  .object({
    count: z.number().int().min(1).max(20).optional(),
    /** A lesson id whose reflection should be included as context — must belong to the requesting teacher. */
    reflectionSourceLessonId: z.string().trim().min(1).optional(),
  })
  .strict();
export type AIGenerationOptions = z.infer<typeof AIGenerationOptionsSchema>;

// --- Output: one schema per generate* method ------------------------------

export const EssentialQuestionsSuggestionSchema = z
  .object({
    essentialQuestions: z.array(nonEmptyTrimmed.max(500)).max(20),
  })
  .strict();
export type EssentialQuestionsSuggestion = z.infer<typeof EssentialQuestionsSuggestionSchema>;

export const PedagogicalStrategiesSuggestionSchema = z
  .object({
    pedagogicalStrategies: z.array(nonEmptyTrimmed.max(500)).max(20),
  })
  .strict();
export type PedagogicalStrategiesSuggestion = z.infer<
  typeof PedagogicalStrategiesSuggestionSchema
>;

export const TeachingLearningResourcesSuggestionSchema = z
  .object({
    teachingLearningResources: z.array(nonEmptyTrimmed.max(500)).max(20),
  })
  .strict();
export type TeachingLearningResourcesSuggestion = z.infer<
  typeof TeachingLearningResourcesSuggestionSchema
>;

export const PedagogicalExemplarsSuggestionSchema = z
  .object({
    pedagogicalExemplars: z.array(nonEmptyTrimmed.max(500)).max(20),
  })
  .strict();
export type PedagogicalExemplarsSuggestion = z.infer<typeof PedagogicalExemplarsSuggestionSchema>;

/** Same 7 independent dimensions as the wizard's differentiation editor — never a single note. */
export const DifferentiationSuggestionSchema = z
  .object({
    differentiation: DifferentiationPlanSchema,
  })
  .strict();
export type DifferentiationSuggestion = z.infer<typeof DifferentiationSuggestionSchema>;

/**
 * The "main" lesson flow only (Starter/Introductory/Activity/Assessment
 * stages) — closure is generated separately by `generateClosure`. Rejects
 * a CLOSURE-stage row here so the two methods' responsibilities can't
 * silently overlap.
 */
export const LessonActivitiesSuggestionSchema = z
  .object({
    lessonActivities: z
      .array(LessonActivityInputSchema)
      .max(20)
      .refine((activities) => activities.every((a) => a.stage !== "CLOSURE"), {
        message: "generateLessonActivities must not include a CLOSURE-stage row — use generateClosure.",
      }),
  })
  .strict();
export type LessonActivitiesSuggestion = z.infer<typeof LessonActivitiesSuggestionSchema>;

export const AssessmentsSuggestionSchema = z
  .object({
    assessments: z.array(AssessmentInputSchema).max(20),
  })
  .strict();
export type AssessmentsSuggestion = z.infer<typeof AssessmentsSuggestionSchema>;

export const ClosureSuggestionSchema = z
  .object({
    closure: LessonActivityInputSchema.extend({ stage: z.literal("CLOSURE") }),
  })
  .strict();
export type ClosureSuggestion = z.infer<typeof ClosureSuggestionSchema>;

/**
 * One coherent draft covering everything the other 6 methods cover.
 * `lessonActivities` here DOES include the CLOSURE-stage row (unlike
 * `generateLessonActivities` alone) because that matches how a lesson's
 * activities are actually stored — one unified, sequenced list.
 */
export const FullLessonDraftSuggestionSchema = z
  .object({
    essentialQuestions: z.array(nonEmptyTrimmed.max(500)).max(20),
    pedagogicalStrategies: z.array(nonEmptyTrimmed.max(500)).max(20),
    differentiation: DifferentiationPlanSchema,
    lessonActivities: z
      .array(LessonActivityInputSchema)
      .max(25)
      .refine((activities) => activities.some((a) => a.stage === "CLOSURE"), {
        message: "generateFullLessonDraft's lessonActivities must include a Lesson Closure row.",
      }),
    assessments: z.array(AssessmentInputSchema).max(20),
  })
  .strict();
export type FullLessonDraftSuggestion = z.infer<typeof FullLessonDraftSuggestionSchema>;

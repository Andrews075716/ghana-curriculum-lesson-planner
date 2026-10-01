import { AICurriculumIneligibleError, ValidationError } from "@/server/errors/app-error";
import { AICurriculumContextSchema, type AICurriculumContext } from "@/lib/validation/ai.schema";
import { getAiEligibleCurriculumContext } from "@/server/services/curriculum.service";
import type { CurriculumContext } from "@/server/services/curriculum.service";
import { getReflectionTextForAIContext } from "@/server/repositories/lesson.repository";

/**
 * Builds the read-only `AICurriculumContext` every AI request must carry —
 * resolved fresh from the curriculum database every time, and ALWAYS
 * through `getAiEligibleCurriculumContext()` (see
 * curriculum-eligibility.service.ts / docs/curriculum-status-policy.md).
 * This is the curriculum safety boundary: this function has no other path
 * to curriculum data, so an AI provider can never see a REJECTED node, an
 * unresolved NEEDS_REVIEW node, or anything else the eligibility policy
 * excludes — that check happens once, here, not duplicated at every call
 * site. Nothing here accepts curriculum text from a caller; only an id (to
 * look up) and the lesson's planned duration (a planner field, not a
 * curriculum field) go in.
 *
 * `reflectionSourceLessonId` is the one opt-in exception: when the
 * teacher has explicitly chosen a previous lesson to use as context, its
 * reflection text (ownership-checked against `teacherId`) is folded in as
 * `previousLessonReflection`. That lesson is only ever read here — this
 * function has no write path back to it.
 */
export async function buildAICurriculumContext(
  learningIndicatorId: string,
  durationMinutes: number,
  teacherId: string,
  reflectionSourceLessonId?: string,
): Promise<AICurriculumContext> {
  const result = await getAiEligibleCurriculumContext(learningIndicatorId);
  if (!result.eligible) {
    throw new AICurriculumIneligibleError(
      "AI assistance isn't available for this curriculum selection: the selected curriculum data is " +
        "missing information AI generation needs (such as source-page traceability), or has been marked " +
        "unusable during curriculum review. You can continue planning this lesson manually.",
      { cause: result.ineligibleReason },
    );
  }

  const previousLessonReflection = reflectionSourceLessonId
    ? ((await getReflectionTextForAIContext(teacherId, reflectionSourceLessonId)) ?? undefined)
    : undefined;

  const parsed = AICurriculumContextSchema.safeParse({
    ...mapToAICurriculumContext(result.context),
    durationMinutes,
    previousLessonReflection,
  });

  if (!parsed.success) {
    throw new ValidationError("Could not build AI curriculum context.", { cause: parsed.error });
  }

  return parsed.data;
}

/**
 * Flattens the official-data `CurriculumContext` (ids + text, admin-facing
 * shape) into the AI-facing shape: text only, no database ids anywhere,
 * empty/absent guidance omitted rather than sent as blank strings — see
 * the "data minimisation" note in docs/checkpoint-8-ai-audit.md.
 */
function mapToAICurriculumContext(
  context: CurriculumContext,
): Omit<AICurriculumContext, "durationMinutes" | "previousLessonReflection"> {
  const additionalContentStandards = context.contentStandard.additional.map((cs) => cs.description);

  const curriculumCodesEntries = {
    contentStandard: context.contentStandard.primary.code ?? undefined,
    learningOutcome: context.learningOutcome.code ?? undefined,
    learningIndicator: context.learningIndicator.code ?? undefined,
  };
  const curriculumCodes = Object.values(curriculumCodesEntries).some(Boolean)
    ? curriculumCodesEntries
    : undefined;

  const loGuidance = context.learningOutcome.guidance;
  const liGuidance = context.learningIndicator.guidance;
  const officialGuidanceEntries = {
    twentyFirstCenturySkills: loGuidance?.twentyFirstCenturySkills ?? undefined,
    gesi: loGuidance?.gesi ?? undefined,
    sel: loGuidance?.sel ?? undefined,
    nationalCoreValues: loGuidance?.nationalCoreValues?.length ? loGuidance.nationalCoreValues : undefined,
    pedagogicalExemplars: liGuidance?.pedagogicalExemplars?.length ? liGuidance.pedagogicalExemplars : undefined,
    dokDescriptions: liGuidance?.dokDescriptions?.length ? liGuidance.dokDescriptions : undefined,
  };
  const officialGuidance = Object.values(officialGuidanceEntries).some((v) => v !== undefined)
    ? officialGuidanceEntries
    : undefined;

  const curriculumVersion = context.curriculumVersion.year
    ? `${context.curriculumVersion.name} (${context.curriculumVersion.year})`
    : context.curriculumVersion.name;

  return {
    subject: context.subject.name,
    classLevel: context.classLevel.name,
    strand: context.strand.description,
    subStrand: context.subStrand.description,
    contentStandard: context.contentStandard.primary.description,
    learningOutcome: context.learningOutcome.description,
    learningIndicator: context.learningIndicator.description,
    additionalContentStandards: additionalContentStandards.length ? additionalContentStandards : undefined,
    curriculumCodes,
    officialGuidance,
    curriculumVersion,
  };
}

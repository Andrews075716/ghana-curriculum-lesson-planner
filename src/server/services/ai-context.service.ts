import { NotFoundError, ValidationError } from "@/server/errors/app-error";
import { AICurriculumContextSchema, type AICurriculumContext } from "@/lib/validation/ai.schema";
import { getLearningIndicatorTextPath } from "@/server/repositories/curriculum.repository";
import { getReflectionTextForAIContext } from "@/server/repositories/lesson.repository";

/**
 * Builds the read-only `AICurriculumContext` every AI request must carry —
 * subject, class, strand, sub-strand, content standard, learning
 * outcome, learning indicator, and duration — resolved fresh from the
 * curriculum database every time. Nothing here accepts curriculum text
 * from a caller; only an id (to look up) and the lesson's planned
 * duration (a planner field, not a curriculum field) go in.
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
  const path = await getLearningIndicatorTextPath(learningIndicatorId);
  if (!path) {
    throw new NotFoundError(`Learning indicator "${learningIndicatorId}" was not found.`);
  }

  const previousLessonReflection = reflectionSourceLessonId
    ? ((await getReflectionTextForAIContext(teacherId, reflectionSourceLessonId)) ?? undefined)
    : undefined;

  const parsed = AICurriculumContextSchema.safeParse({
    subject: path.subject,
    classLevel: path.classLevel,
    strand: path.strand,
    subStrand: path.subStrand,
    contentStandard: path.contentStandard,
    learningOutcome: path.learningOutcome,
    learningIndicator: path.learningIndicator,
    durationMinutes,
    previousLessonReflection,
  });

  if (!parsed.success) {
    throw new ValidationError("Could not build AI curriculum context.", { cause: parsed.error });
  }

  return parsed.data;
}

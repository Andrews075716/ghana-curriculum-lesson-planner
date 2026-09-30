import { NotFoundError, ValidationError } from "@/server/errors/app-error";
import { ReflectionInputSchema } from "@/lib/validation/lesson.schema";
import {
  getLessonDetail,
  listPreviousLessonsWithReflection,
  upsertReflection,
  type LessonDetail,
  type ReflectableLessonOption,
} from "@/server/repositories/lesson.repository";

export async function getLessonDetailForTeacher(
  plannerId: string,
  lessonId: string,
  teacherId: string,
): Promise<LessonDetail> {
  const lesson = await getLessonDetail(plannerId, lessonId, teacherId);
  if (!lesson) {
    throw new NotFoundError("Lesson not found.");
  }
  return lesson;
}

/**
 * Saves a (partial) reflection. Purely additive/corrective — this never
 * touches the lesson plan itself (activities, assessments, curriculum
 * alignment), only the separate Reflection row, and only for the lesson
 * the teacher is explicitly editing.
 */
export async function saveReflection(
  plannerId: string,
  lessonId: string,
  teacherId: string,
  rawData: unknown,
): Promise<void> {
  const parsed = ReflectionInputSchema.safeParse(rawData);
  if (!parsed.success) {
    throw new ValidationError("Invalid reflection data.", { cause: parsed.error });
  }

  const saved = await upsertReflection(plannerId, lessonId, teacherId, parsed.data);
  if (!saved) {
    throw new NotFoundError("Lesson not found.");
  }
}

export async function getReflectableLessons(
  teacherId: string,
  subjectId: string,
  classLevelId: string,
  excludePlannerId: string,
): Promise<ReflectableLessonOption[]> {
  return listPreviousLessonsWithReflection(teacherId, subjectId, classLevelId, excludePlannerId);
}

import { NotFoundError, ValidationError } from "@/server/errors/app-error";
import { ClassInputSchema, ClassArchiveSchema } from "@/lib/validation/class.schema";
import * as curriculumRepository from "@/server/repositories/curriculum.repository";
import {
  createClass,
  getClassForTeacher,
  listClassesForTeacher,
  setClassArchived,
  updateClass,
  type ClassRow,
} from "@/server/repositories/class.repository";

export type { ClassRow };

async function assertCurriculumRefsExist(subjectId: string, classLevelId: string) {
  const [subject, classLevel] = await Promise.all([
    curriculumRepository.subjectExists(subjectId),
    curriculumRepository.classLevelExists(classLevelId),
  ]);
  if (!subject) throw new NotFoundError(`Subject "${subjectId}" was not found.`);
  if (!classLevel) throw new NotFoundError(`Class level "${classLevelId}" was not found.`);
}

export async function getMyClasses(teacherId: string): Promise<ClassRow[]> {
  return listClassesForTeacher(teacherId);
}

export async function getClassForTeacherOrThrow(id: string, teacherId: string): Promise<ClassRow> {
  const row = await getClassForTeacher(id, teacherId);
  if (!row) throw new NotFoundError("Class not found.");
  return row;
}

export async function createClassForTeacher(teacherId: string, rawInput: unknown): Promise<string> {
  const parsed = ClassInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid class details.", { cause: parsed.error });
  }
  await assertCurriculumRefsExist(parsed.data.subjectId, parsed.data.classLevelId);
  return createClass(teacherId, parsed.data);
}

export async function updateClassForTeacher(
  id: string,
  teacherId: string,
  rawInput: unknown,
): Promise<void> {
  const parsed = ClassInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid class details.", { cause: parsed.error });
  }
  await assertCurriculumRefsExist(parsed.data.subjectId, parsed.data.classLevelId);
  const updated = await updateClass(id, teacherId, parsed.data);
  if (!updated) throw new NotFoundError("Class not found.");
}

export async function setClassArchivedForTeacher(
  id: string,
  teacherId: string,
  rawInput: unknown,
): Promise<void> {
  const parsed = ClassArchiveSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid request.", { cause: parsed.error });
  }
  const updated = await setClassArchived(id, teacherId, parsed.data.archived);
  if (!updated) throw new NotFoundError("Class not found.");
}

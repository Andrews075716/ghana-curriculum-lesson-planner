import "server-only";
import { Prisma } from "@prisma/client";
import type { z } from "zod";
import { prisma } from "@/server/db/prisma";
import { requireAdminSession } from "@/server/auth/rbac";
import { ConflictError, NotFoundError, ValidationError } from "@/server/errors/app-error";
import * as repo from "@/server/repositories/curriculum-admin.repository";
import {
  ClassLevelSchema,
  ContentStandardSchema,
  CurriculumVersionSchema,
  ImportRequestSchema,
  LearningIndicatorSchema,
  LearningOutcomeSchema,
  SubjectSchema,
  StrandSchema,
  SubStrandSchema,
} from "@/lib/validation/curriculum-admin.schema";
import {
  previewCurriculumImport,
  commitCurriculumImportPipeline,
} from "@/server/services/curriculum-import/preview-import";
import type { ImportPreview } from "@/server/services/curriculum-import/types";

/**
 * Every mutating function here starts with `requireAdminSession()` — this
 * is the actual, server-side enforcement of "a teacher must never modify
 * official curriculum records," independent of whatever the API routes or
 * UI do. Reads (list/get) are also gated: this whole module backs the
 * admin management area, a separate surface from the teacher-facing
 * curriculum selector in `curriculum.service.ts`.
 */

function parseOrThrow<T>(schema: z.ZodType<T>, input: unknown): T {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid input.", { cause: parsed.error });
  }
  return parsed.data;
}

async function assertUniqueViolation<T>(fn: () => Promise<T>, message: string): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ConflictError(message);
    }
    throw error;
  }
}

// --- Subjects ------------------------------------------------------------

export async function listSubjectsAdmin() {
  await requireAdminSession();
  return repo.listSubjects();
}

export async function createSubjectAdmin(input: unknown) {
  await requireAdminSession();
  const data = parseOrThrow(SubjectSchema, input);
  return assertUniqueViolation(
    () => repo.createSubject(data),
    `A subject with code "${data.code}" or name "${data.name}" already exists.`,
  );
}

export async function updateSubjectAdmin(id: string, input: unknown) {
  await requireAdminSession();
  const data = parseOrThrow(SubjectSchema, input);
  if (!(await repo.getSubject(id))) throw new NotFoundError("Subject not found.");
  return assertUniqueViolation(
    () => repo.updateSubject(id, data),
    `A subject with code "${data.code}" or name "${data.name}" already exists.`,
  );
}

export async function deleteSubjectAdmin(id: string) {
  await requireAdminSession();
  if (!(await repo.getSubject(id))) throw new NotFoundError("Subject not found.");
  const strandCount = await repo.countStrandsForSubject(id);
  if (strandCount > 0) {
    throw new ConflictError(`Cannot delete: ${strandCount} strand(s) reference this subject.`);
  }
  await repo.deleteSubject(id);
}

// --- Class levels ----------------------------------------------------------

export async function listClassLevelsAdmin() {
  await requireAdminSession();
  return repo.listClassLevels();
}

export async function createClassLevelAdmin(input: unknown) {
  await requireAdminSession();
  const data = parseOrThrow(ClassLevelSchema, input);
  return assertUniqueViolation(
    () => repo.createClassLevel(data),
    `A class level with name "${data.name}" or sequence ${data.sequence} already exists.`,
  );
}

export async function updateClassLevelAdmin(id: string, input: unknown) {
  await requireAdminSession();
  const data = parseOrThrow(ClassLevelSchema, input);
  if (!(await repo.getClassLevel(id))) throw new NotFoundError("Class level not found.");
  return assertUniqueViolation(
    () => repo.updateClassLevel(id, data),
    `A class level with name "${data.name}" or sequence ${data.sequence} already exists.`,
  );
}

export async function deleteClassLevelAdmin(id: string) {
  await requireAdminSession();
  if (!(await repo.getClassLevel(id))) throw new NotFoundError("Class level not found.");
  const strandCount = await repo.countStrandsForClassLevel(id);
  if (strandCount > 0) {
    throw new ConflictError(`Cannot delete: ${strandCount} strand(s) reference this class level.`);
  }
  await repo.deleteClassLevel(id);
}

// --- Curriculum versions -----------------------------------------------

export async function listCurriculumVersionsAdmin() {
  await requireAdminSession();
  return repo.listCurriculumVersions();
}

export async function createCurriculumVersionAdmin(input: unknown) {
  await requireAdminSession();
  const data = parseOrThrow(CurriculumVersionSchema, input);
  return assertUniqueViolation(
    () => repo.createCurriculumVersion(data),
    `A curriculum version named "${data.name}" already exists.`,
  );
}

export async function updateCurriculumVersionAdmin(id: string, input: unknown) {
  await requireAdminSession();
  const data = parseOrThrow(CurriculumVersionSchema, input);
  if (!(await repo.getCurriculumVersion(id))) throw new NotFoundError("Curriculum version not found.");
  return assertUniqueViolation(
    () => repo.updateCurriculumVersion(id, data),
    `A curriculum version named "${data.name}" already exists.`,
  );
}

export async function deleteCurriculumVersionAdmin(id: string) {
  await requireAdminSession();
  if (!(await repo.getCurriculumVersion(id))) throw new NotFoundError("Curriculum version not found.");
  const strandCount = await repo.countStrandsForCurriculumVersion(id);
  if (strandCount > 0) {
    throw new ConflictError(`Cannot delete: ${strandCount} strand(s) reference this curriculum version.`);
  }
  await repo.deleteCurriculumVersion(id);
}

// --- Strands -----------------------------------------------------------

export async function listStrandsAdmin(filter: {
  subjectId?: string;
  classLevelId?: string;
  curriculumVersionId?: string;
}) {
  await requireAdminSession();
  return repo.listStrands(filter);
}

async function assertStrandParentsExist(data: { subjectId: string; classLevelId: string; curriculumVersionId: string }) {
  const [subject, classLevel, version] = await Promise.all([
    repo.subjectExists(data.subjectId),
    repo.classLevelExists(data.classLevelId),
    repo.curriculumVersionExists(data.curriculumVersionId),
  ]);
  if (!subject) throw new NotFoundError(`Subject "${data.subjectId}" was not found.`);
  if (!classLevel) throw new NotFoundError(`Class level "${data.classLevelId}" was not found.`);
  if (!version) throw new NotFoundError(`Curriculum version "${data.curriculumVersionId}" was not found.`);
}

export async function createStrandAdmin(input: unknown) {
  await requireAdminSession();
  const data = parseOrThrow(StrandSchema, input);
  await assertStrandParentsExist(data);
  return assertUniqueViolation(
    () => repo.createStrand(data),
    `A strand with code "${data.code}" already exists.`,
  );
}

export async function updateStrandAdmin(id: string, input: unknown) {
  await requireAdminSession();
  const data = parseOrThrow(StrandSchema, input);
  if (!(await repo.getStrand(id))) throw new NotFoundError("Strand not found.");
  await assertStrandParentsExist(data);
  return assertUniqueViolation(
    () => repo.updateStrand(id, data),
    `A strand with code "${data.code}" already exists.`,
  );
}

export async function deleteStrandAdmin(id: string) {
  await requireAdminSession();
  if (!(await repo.getStrand(id))) throw new NotFoundError("Strand not found.");
  const childCount = await repo.countSubStrandsForStrand(id);
  if (childCount > 0) {
    throw new ConflictError(`Cannot delete: ${childCount} sub-strand(s) reference this strand.`);
  }
  await repo.deleteStrand(id);
}

// --- Sub-strands -------------------------------------------------------

export async function listSubStrandsAdmin(strandId: string) {
  await requireAdminSession();
  if (!(await repo.strandExists(strandId))) throw new NotFoundError("Strand not found.");
  return repo.listSubStrands(strandId);
}

export async function createSubStrandAdmin(input: unknown) {
  await requireAdminSession();
  const data = parseOrThrow(SubStrandSchema, input);
  if (!(await repo.strandExists(data.strandId))) throw new NotFoundError("Strand not found.");
  return assertUniqueViolation(
    () => repo.createSubStrand(data),
    `A sub-strand with code "${data.code}" already exists.`,
  );
}

export async function updateSubStrandAdmin(id: string, input: unknown) {
  await requireAdminSession();
  const data = parseOrThrow(SubStrandSchema, input);
  if (!(await repo.getSubStrand(id))) throw new NotFoundError("Sub-strand not found.");
  if (!(await repo.strandExists(data.strandId))) throw new NotFoundError("Strand not found.");
  return assertUniqueViolation(
    () => repo.updateSubStrand(id, data),
    `A sub-strand with code "${data.code}" already exists.`,
  );
}

export async function deleteSubStrandAdmin(id: string) {
  await requireAdminSession();
  if (!(await repo.getSubStrand(id))) throw new NotFoundError("Sub-strand not found.");
  const childCount = await repo.countContentStandardsForSubStrand(id);
  if (childCount > 0) {
    throw new ConflictError(`Cannot delete: ${childCount} content standard(s) reference this sub-strand.`);
  }
  await repo.deleteSubStrand(id);
}

// --- Content standards ---------------------------------------------------

export async function listContentStandardsAdmin(subStrandId: string) {
  await requireAdminSession();
  if (!(await repo.subStrandExists(subStrandId))) throw new NotFoundError("Sub-strand not found.");
  return repo.listContentStandards(subStrandId);
}

export async function createContentStandardAdmin(input: unknown) {
  await requireAdminSession();
  const data = parseOrThrow(ContentStandardSchema, input);
  if (!(await repo.subStrandExists(data.subStrandId))) throw new NotFoundError("Sub-strand not found.");
  return assertUniqueViolation(
    () => repo.createContentStandard(data),
    `A content standard with code "${data.code}" already exists.`,
  );
}

export async function updateContentStandardAdmin(id: string, input: unknown) {
  await requireAdminSession();
  const data = parseOrThrow(ContentStandardSchema, input);
  if (!(await repo.getContentStandard(id))) throw new NotFoundError("Content standard not found.");
  if (!(await repo.subStrandExists(data.subStrandId))) throw new NotFoundError("Sub-strand not found.");
  return assertUniqueViolation(
    () => repo.updateContentStandard(id, data),
    `A content standard with code "${data.code}" already exists.`,
  );
}

export async function deleteContentStandardAdmin(id: string) {
  await requireAdminSession();
  if (!(await repo.getContentStandard(id))) throw new NotFoundError("Content standard not found.");
  const childCount = await repo.countLearningOutcomesForContentStandard(id);
  if (childCount > 0) {
    throw new ConflictError(`Cannot delete: ${childCount} learning outcome(s) reference this content standard.`);
  }
  await repo.deleteContentStandard(id);
}

// --- Learning outcomes -----------------------------------------------------

export async function listLearningOutcomesAdmin(contentStandardId: string) {
  await requireAdminSession();
  if (!(await repo.contentStandardExists(contentStandardId))) {
    throw new NotFoundError("Content standard not found.");
  }
  return repo.listLearningOutcomes(contentStandardId);
}

export async function createLearningOutcomeAdmin(input: unknown) {
  await requireAdminSession();
  const data = parseOrThrow(LearningOutcomeSchema, input);
  if (!(await repo.contentStandardExists(data.contentStandardId))) {
    throw new NotFoundError("Content standard not found.");
  }
  return repo.createLearningOutcome(data);
}

export async function updateLearningOutcomeAdmin(id: string, input: unknown) {
  await requireAdminSession();
  const data = parseOrThrow(LearningOutcomeSchema, input);
  if (!(await repo.getLearningOutcome(id))) throw new NotFoundError("Learning outcome not found.");
  if (!(await repo.contentStandardExists(data.contentStandardId))) {
    throw new NotFoundError("Content standard not found.");
  }
  return repo.updateLearningOutcome(id, data);
}

export async function deleteLearningOutcomeAdmin(id: string) {
  await requireAdminSession();
  if (!(await repo.getLearningOutcome(id))) throw new NotFoundError("Learning outcome not found.");
  const childCount = await repo.countLearningIndicatorsForOutcome(id);
  if (childCount > 0) {
    throw new ConflictError(`Cannot delete: ${childCount} learning indicator(s) reference this outcome.`);
  }
  await repo.deleteLearningOutcome(id);
}

// --- Learning indicators ---------------------------------------------------

export async function listLearningIndicatorsAdmin(learningOutcomeId: string) {
  await requireAdminSession();
  if (!(await repo.learningOutcomeExists(learningOutcomeId))) {
    throw new NotFoundError("Learning outcome not found.");
  }
  return repo.listLearningIndicators(learningOutcomeId);
}

export async function createLearningIndicatorAdmin(input: unknown) {
  await requireAdminSession();
  const data = parseOrThrow(LearningIndicatorSchema, input);
  if (!(await repo.learningOutcomeExists(data.learningOutcomeId))) {
    throw new NotFoundError("Learning outcome not found.");
  }
  return assertUniqueViolation(
    () => repo.createLearningIndicator(data),
    `A learning indicator with code "${data.code}" already exists.`,
  );
}

export async function updateLearningIndicatorAdmin(id: string, input: unknown) {
  await requireAdminSession();
  const data = parseOrThrow(LearningIndicatorSchema, input);
  if (!(await repo.getLearningIndicator(id))) throw new NotFoundError("Learning indicator not found.");
  if (!(await repo.learningOutcomeExists(data.learningOutcomeId))) {
    throw new NotFoundError("Learning outcome not found.");
  }
  return assertUniqueViolation(
    () => repo.updateLearningIndicator(id, data),
    `A learning indicator with code "${data.code}" already exists.`,
  );
}

export async function deleteLearningIndicatorAdmin(id: string) {
  await requireAdminSession();
  if (!(await repo.getLearningIndicator(id))) throw new NotFoundError("Learning indicator not found.");
  const plannerCount = await repo.countPlannersForIndicator(id);
  if (plannerCount > 0) {
    throw new ConflictError(`Cannot delete: ${plannerCount} lesson planner(s) reference this indicator.`);
  }
  await repo.deleteLearningIndicator(id);
}

// --- Import ------------------------------------------------------------

export async function previewCurriculumImportAdmin(format: unknown, content: unknown): Promise<ImportPreview> {
  await requireAdminSession();
  const input = parseOrThrow(ImportRequestSchema, { format, content });
  return previewCurriculumImport(input.format, input.content);
}

export async function commitCurriculumImportAdmin(format: unknown, content: unknown): Promise<ImportPreview> {
  await requireAdminSession();
  const input = parseOrThrow(ImportRequestSchema, { format, content });
  const result = await commitCurriculumImportPipeline(prisma, input.format, input.content);
  if (!result.canCommit) {
    throw new ValidationError("Import has validation errors; nothing was committed. Fix the issues and try again.");
  }
  return result;
}

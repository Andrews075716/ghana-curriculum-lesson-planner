import { prisma } from "@/server/db/prisma";
import type { CurriculumVersionStatus } from "@prisma/client";
import {
  subjectExists,
  classLevelExists,
  strandExists,
  subStrandExists,
  contentStandardExists,
  learningOutcomeExists,
} from "@/server/repositories/curriculum.repository";

// --- Existence checks (parent-id validation for create/update) ---------
//
// The six checks above are identical for both the teacher-facing selector
// and the admin CRUD service, so they're defined once in
// curriculum.repository.ts and re-exported here rather than duplicated.
export { subjectExists, classLevelExists, strandExists, subStrandExists, contentStandardExists, learningOutcomeExists };

export async function curriculumVersionExists(id: string): Promise<boolean> {
  return (await prisma.curriculumVersion.count({ where: { id } })) > 0;
}

// --- Subjects ----------------------------------------------------------

export function listSubjects() {
  return prisma.subject.findMany({ orderBy: { name: "asc" } });
}

export function getSubject(id: string) {
  return prisma.subject.findUnique({ where: { id } });
}

export function createSubject(data: { code: string; name: string }) {
  return prisma.subject.create({ data });
}

export function updateSubject(id: string, data: { code: string; name: string }) {
  return prisma.subject.update({ where: { id }, data });
}

export async function countStrandsForSubject(subjectId: string): Promise<number> {
  return prisma.strand.count({ where: { subjectId } });
}

export function deleteSubject(id: string) {
  return prisma.subject.delete({ where: { id } });
}

// --- Class levels --------------------------------------------------------

export function listClassLevels() {
  return prisma.classLevel.findMany({ orderBy: { sequence: "asc" } });
}

export function getClassLevel(id: string) {
  return prisma.classLevel.findUnique({ where: { id } });
}

export function createClassLevel(data: { name: string; sequence: number }) {
  return prisma.classLevel.create({ data });
}

export function updateClassLevel(id: string, data: { name: string; sequence: number }) {
  return prisma.classLevel.update({ where: { id }, data });
}

export async function countStrandsForClassLevel(classLevelId: string): Promise<number> {
  return prisma.strand.count({ where: { classLevelId } });
}

export function deleteClassLevel(id: string) {
  return prisma.classLevel.delete({ where: { id } });
}

// --- Curriculum versions -------------------------------------------------

export function listCurriculumVersions() {
  return prisma.curriculumVersion.findMany({ orderBy: { createdAt: "desc" } });
}

export function getCurriculumVersion(id: string) {
  return prisma.curriculumVersion.findUnique({ where: { id } });
}

export function createCurriculumVersion(data: {
  name: string;
  year?: number | null;
  status: CurriculumVersionStatus;
}) {
  return prisma.curriculumVersion.create({ data });
}

export function updateCurriculumVersion(
  id: string,
  data: { name: string; year?: number | null; status: CurriculumVersionStatus },
) {
  return prisma.curriculumVersion.update({ where: { id }, data });
}

export async function countStrandsForCurriculumVersion(curriculumVersionId: string): Promise<number> {
  return prisma.strand.count({ where: { curriculumVersionId } });
}

export function deleteCurriculumVersion(id: string) {
  return prisma.curriculumVersion.delete({ where: { id } });
}

// --- Strands ---------------------------------------------------------------

export function listStrands(filter: {
  subjectId?: string;
  classLevelId?: string;
  curriculumVersionId?: string;
}) {
  return prisma.strand.findMany({
    where: filter,
    orderBy: { sequence: "asc" },
    include: { subStrands: { select: { id: true } } },
  });
}

export function getStrand(id: string) {
  return prisma.strand.findUnique({ where: { id } });
}

export interface StrandWriteInput {
  subjectId: string;
  classLevelId: string;
  curriculumVersionId: string;
  name: string;
  code?: string | null;
  sequence: number;
}

export function createStrand(data: StrandWriteInput) {
  return prisma.strand.create({ data });
}

export function updateStrand(id: string, data: StrandWriteInput) {
  return prisma.strand.update({ where: { id }, data });
}

export async function countSubStrandsForStrand(strandId: string): Promise<number> {
  return prisma.subStrand.count({ where: { strandId } });
}

export function deleteStrand(id: string) {
  return prisma.strand.delete({ where: { id } });
}

// --- Sub-strands -------------------------------------------------------

export function listSubStrands(strandId: string) {
  return prisma.subStrand.findMany({
    where: { strandId },
    orderBy: { sequence: "asc" },
    include: { contentStandards: { select: { id: true } } },
  });
}

export function getSubStrand(id: string) {
  return prisma.subStrand.findUnique({ where: { id } });
}

export interface SubStrandWriteInput {
  strandId: string;
  name: string;
  code?: string | null;
  sequence: number;
}

export function createSubStrand(data: SubStrandWriteInput) {
  return prisma.subStrand.create({ data });
}

export function updateSubStrand(id: string, data: SubStrandWriteInput) {
  return prisma.subStrand.update({ where: { id }, data });
}

export async function countContentStandardsForSubStrand(subStrandId: string): Promise<number> {
  return prisma.contentStandard.count({ where: { subStrandId } });
}

export function deleteSubStrand(id: string) {
  return prisma.subStrand.delete({ where: { id } });
}

// --- Content standards -------------------------------------------------

export function listContentStandards(subStrandId: string) {
  return prisma.contentStandard.findMany({
    where: { subStrandId },
    orderBy: { sequence: "asc" },
    include: { learningOutcomes: { select: { id: true } } },
  });
}

export function getContentStandard(id: string) {
  return prisma.contentStandard.findUnique({ where: { id } });
}

export interface ContentStandardWriteInput {
  subStrandId: string;
  code?: string | null;
  description: string;
  sequence: number;
}

export function createContentStandard(data: ContentStandardWriteInput) {
  return prisma.contentStandard.create({ data });
}

export function updateContentStandard(id: string, data: ContentStandardWriteInput) {
  return prisma.contentStandard.update({ where: { id }, data });
}

export async function countLearningOutcomesForContentStandard(contentStandardId: string): Promise<number> {
  return prisma.learningOutcome.count({ where: { contentStandardId } });
}

export function deleteContentStandard(id: string) {
  return prisma.contentStandard.delete({ where: { id } });
}

// --- Learning outcomes ---------------------------------------------------

export function listLearningOutcomes(contentStandardId: string) {
  return prisma.learningOutcome.findMany({
    where: { contentStandardId },
    orderBy: { sequence: "asc" },
    include: { learningIndicators: { select: { id: true } } },
  });
}

export function getLearningOutcome(id: string) {
  return prisma.learningOutcome.findUnique({ where: { id } });
}

export interface LearningOutcomeWriteInput {
  contentStandardId: string;
  description: string;
  sequence: number;
}

export function createLearningOutcome(data: LearningOutcomeWriteInput) {
  return prisma.learningOutcome.create({ data });
}

export function updateLearningOutcome(id: string, data: LearningOutcomeWriteInput) {
  return prisma.learningOutcome.update({ where: { id }, data });
}

export async function countLearningIndicatorsForOutcome(learningOutcomeId: string): Promise<number> {
  return prisma.learningIndicator.count({ where: { learningOutcomeId } });
}

export function deleteLearningOutcome(id: string) {
  return prisma.learningOutcome.delete({ where: { id } });
}

// --- Learning indicators -------------------------------------------------

export function listLearningIndicators(learningOutcomeId: string) {
  return prisma.learningIndicator.findMany({
    where: { learningOutcomeId },
    orderBy: { sequence: "asc" },
  });
}

export function getLearningIndicator(id: string) {
  return prisma.learningIndicator.findUnique({ where: { id } });
}

export interface LearningIndicatorWriteInput {
  learningOutcomeId: string;
  code?: string | null;
  description: string;
  sequence: number;
}

export function createLearningIndicator(data: LearningIndicatorWriteInput) {
  return prisma.learningIndicator.create({ data });
}

export function updateLearningIndicator(id: string, data: LearningIndicatorWriteInput) {
  return prisma.learningIndicator.update({ where: { id }, data });
}

export async function countPlannersForIndicator(learningIndicatorId: string): Promise<number> {
  return prisma.lessonPlanner.count({ where: { learningIndicatorId } });
}

export function deleteLearningIndicator(id: string) {
  return prisma.learningIndicator.delete({ where: { id } });
}

import { NotFoundError } from "@/server/errors/app-error";
import * as curriculumRepository from "@/server/repositories/curriculum.repository";
import type {
  CurriculumContext,
  CurriculumOption,
  CurriculumSearchResult,
  LearningIndicatorPath,
  LearningOutcomeReverseRelationships,
} from "@/server/repositories/curriculum.repository";

export type {
  CurriculumContext,
  CurriculumOption,
  CurriculumSearchResult,
  LearningIndicatorPath,
  LearningOutcomeReverseRelationships,
};

export async function getSubjects(): Promise<CurriculumOption[]> {
  return curriculumRepository.listSubjects();
}

export async function getClassLevels(subjectId: string): Promise<CurriculumOption[]> {
  if (!(await curriculumRepository.subjectExists(subjectId))) {
    throw new NotFoundError(`Subject "${subjectId}" was not found.`);
  }
  return curriculumRepository.listClassLevels(subjectId);
}

export async function getAllClassLevels(): Promise<CurriculumOption[]> {
  return curriculumRepository.listAllClassLevels();
}

export async function getStrands(
  subjectId: string,
  classLevelId: string,
): Promise<CurriculumOption[]> {
  const [subject, classLevel] = await Promise.all([
    curriculumRepository.subjectExists(subjectId),
    curriculumRepository.classLevelExists(classLevelId),
  ]);
  if (!subject) throw new NotFoundError(`Subject "${subjectId}" was not found.`);
  if (!classLevel) {
    throw new NotFoundError(`Class level "${classLevelId}" was not found.`);
  }
  return curriculumRepository.listStrands(subjectId, classLevelId);
}

export async function getSubStrands(strandId: string): Promise<CurriculumOption[]> {
  if (!(await curriculumRepository.strandExists(strandId))) {
    throw new NotFoundError(`Strand "${strandId}" was not found.`);
  }
  return curriculumRepository.listSubStrands(strandId);
}

export async function getContentStandards(
  subStrandId: string,
): Promise<CurriculumOption[]> {
  if (!(await curriculumRepository.subStrandExists(subStrandId))) {
    throw new NotFoundError(`Sub-strand "${subStrandId}" was not found.`);
  }
  return curriculumRepository.listContentStandards(subStrandId);
}

export async function getLearningOutcomes(
  contentStandardId: string,
): Promise<CurriculumOption[]> {
  if (!(await curriculumRepository.contentStandardExists(contentStandardId))) {
    throw new NotFoundError(`Content standard "${contentStandardId}" was not found.`);
  }
  return curriculumRepository.listLearningOutcomes(contentStandardId);
}

export async function getLearningIndicators(
  learningOutcomeId: string,
): Promise<CurriculumOption[]> {
  if (!(await curriculumRepository.learningOutcomeExists(learningOutcomeId))) {
    throw new NotFoundError(`Learning outcome "${learningOutcomeId}" was not found.`);
  }
  return curriculumRepository.listLearningIndicators(learningOutcomeId);
}

export async function searchCurriculum(
  subjectId: string,
  classLevelId: string,
  query: string,
): Promise<CurriculumSearchResult[]> {
  const [subject, classLevel] = await Promise.all([
    curriculumRepository.subjectExists(subjectId),
    curriculumRepository.classLevelExists(classLevelId),
  ]);
  if (!subject) throw new NotFoundError(`Subject "${subjectId}" was not found.`);
  if (!classLevel) {
    throw new NotFoundError(`Class level "${classLevelId}" was not found.`);
  }
  return curriculumRepository.searchLearningIndicators(subjectId, classLevelId, query);
}

export async function getLearningIndicatorPath(
  learningIndicatorId: string,
): Promise<LearningIndicatorPath> {
  const path = await curriculumRepository.getLearningIndicatorPath(learningIndicatorId);
  if (!path) {
    throw new NotFoundError(`Learning indicator "${learningIndicatorId}" was not found.`);
  }
  return path;
}

/**
 * Reverse-relationship lookup for a Learning Outcome: its primary Content
 * Standard, any additional linked Content Standards, and its Learning
 * Indicators. See Checkpoint 7 item 5 — not currently wired into any
 * teacher-facing route.
 */
export async function getLearningOutcomeReverseRelationships(
  learningOutcomeId: string,
): Promise<LearningOutcomeReverseRelationships> {
  const info = await curriculumRepository.getLearningOutcomeReverseRelationships(learningOutcomeId);
  if (!info) {
    throw new NotFoundError(`Learning outcome "${learningOutcomeId}" was not found.`);
  }
  return info;
}

/**
 * The complete curriculum context object for a Learning Indicator (codes,
 * primary + additional Content Standards, official guidance, curriculum
 * version/source metadata) — see Checkpoint 7 item 17. Not sent to any AI
 * provider; Checkpoint 8 owns that decision.
 */
export async function getCurriculumContext(learningIndicatorId: string): Promise<CurriculumContext> {
  const context = await curriculumRepository.getCurriculumContext(learningIndicatorId);
  if (!context) {
    throw new NotFoundError(`Learning indicator "${learningIndicatorId}" was not found.`);
  }
  return context;
}

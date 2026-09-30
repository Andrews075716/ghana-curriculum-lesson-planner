import { NotFoundError } from "@/server/errors/app-error";
import * as curriculumRepository from "@/server/repositories/curriculum.repository";
import type {
  CurriculumContext,
  CurriculumEligibilityNode,
  CurriculumOption,
  CurriculumSearchResult,
  LearningIndicatorPath,
  LearningOutcomeReverseRelationships,
} from "@/server/repositories/curriculum.repository";
import { isEligibleForAiContext } from "@/server/services/curriculum-eligibility.service";

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

export type AiCurriculumEligibilityResult =
  | { eligible: true; context: CurriculumContext }
  | { eligible: false; ineligibleReason: string };

function eligibilityLabel(label: string, node: CurriculumEligibilityNode): string {
  return `${label} (id=${node.id}, extractionStatus=${node.extractionStatus ?? "null"}, reviewStatus=${node.reviewStatus ?? "null"}, sourcePage=${node.sourcePage ?? "null"})`;
}

/**
 * THE sanctioned entry point for handing curriculum data to an AI provider
 * — see docs/curriculum-status-policy.md's "AI context boundary" section.
 * `ai-context.service.ts`'s `buildAICurriculumContext` (Checkpoint 8) calls
 * this exclusively; nothing in the AI layer queries curriculum tables (or
 * `getCurriculumContext`) directly. Checks `isEligibleForAiContext` against
 * every REQUIRED node in the chain (Strand, Sub-Strand, primary Content
 * Standard, Learning Outcome, Learning Indicator) and fails closed with a
 * specific reason if any one of them isn't eligible; additional linked
 * Content Standards are filtered individually rather than failing the
 * whole context, since they're supplementary, not load-bearing.
 *
 * `Strand` is checked with `requireProvenance: false` — confirmed
 * empirically that `sourcePage` is `null` on 100% of strand rows in this
 * data model (a Strand's own heading isn't given a single page number by
 * the extraction pipeline the way its descendants are), so requiring it
 * there would make every context ineligible. `SubStrand` gets no such
 * exemption (99.5% populated) — see curriculum-eligibility.service.ts.
 */
export async function getAiEligibleCurriculumContext(
  learningIndicatorId: string,
): Promise<AiCurriculumEligibilityResult> {
  const chain = await curriculumRepository.getCurriculumEligibilityChain(learningIndicatorId);
  if (!chain) {
    throw new NotFoundError(`Learning indicator "${learningIndicatorId}" was not found.`);
  }

  const requiredNodes: Array<[string, CurriculumEligibilityNode, { requireProvenance?: boolean }?]> = [
    ["Strand", chain.strand, { requireProvenance: false }],
    ["Sub-Strand", chain.subStrand],
    ["Content Standard (primary)", chain.contentStandard.primary],
    ["Learning Outcome", chain.learningOutcome],
    ["Learning Indicator", chain.learningIndicator],
  ];

  for (const [label, node, options] of requiredNodes) {
    if (!isEligibleForAiContext(node, options)) {
      return {
        eligible: false,
        ineligibleReason: `${eligibilityLabel(label, node)} is not AI-eligible.`,
      };
    }
  }

  const eligibleAdditionalIds = new Set(
    chain.contentStandard.additional.filter((n) => isEligibleForAiContext(n)).map((n) => n.id),
  );

  const context = await getCurriculumContext(learningIndicatorId);
  return {
    eligible: true,
    context: {
      ...context,
      contentStandard: {
        ...context.contentStandard,
        additional: context.contentStandard.additional.filter((cs) => eligibleAdditionalIds.has(cs.id)),
      },
    },
  };
}

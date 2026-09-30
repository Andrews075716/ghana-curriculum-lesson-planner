import type { CurriculumVersionStatus } from "@prisma/client";

/**
 * Shape of one subject's curriculum tree, ready for import.
 *
 * This shape is subject-agnostic: any subject/class level's curriculum can be
 * expressed this way and imported through `commitCurriculumTree` without any
 * changes to the import logic — only new data files are needed.
 *
 * `code` fields are stable identifiers used to make imports idempotent
 * (re-running an import updates existing rows instead of duplicating them)
 * and to give every curriculum node a durable reference independent of its
 * description text.
 *
 * This is the canonical definition — `prisma/seed/curriculum-types.ts`
 * re-exports it so the dev seed scripts keep working unchanged.
 */

export interface LearningIndicatorInput {
  code: string;
  description: string;
  sequence: number;
}

export interface LearningOutcomeInput {
  description: string;
  sequence: number;
  indicators: LearningIndicatorInput[];
}

export interface ContentStandardInput {
  code: string;
  description: string;
  sequence: number;
  outcomes: LearningOutcomeInput[];
}

export interface SubStrandInput {
  code: string;
  name: string;
  sequence: number;
  contentStandards: ContentStandardInput[];
}

export interface StrandInput {
  code: string;
  name: string;
  sequence: number;
  /** Branch/option name for subjects that split into tracks in later years (e.g. Applied Technology). `null`/omitted for the overwhelming majority of subjects. */
  pathway?: string | null;
  subStrands: SubStrandInput[];
}

export interface CurriculumTreeInput {
  subject: { code: string; name: string };
  classLevel: { name: string; sequence: number };
  curriculumVersion: {
    name: string;
    year?: number;
    status?: CurriculumVersionStatus;
  };
  strands: StrandInput[];
}

/** One issue found while validating an import — either blocks commit (error) or is informational (warning). */
export interface ImportIssue {
  severity: "error" | "warning";
  /** Human-readable location, e.g. "row 14: strandCode" or "strands[2].subStrands[0].code". */
  path: string;
  message: string;
}

export type ImportNodeAction = "create" | "update" | "unchanged";

export interface ImportLevelCounts {
  create: number;
  update: number;
  unchanged: number;
}

export interface ImportPreview {
  counts: {
    subjects: ImportLevelCounts;
    classLevels: ImportLevelCounts;
    curriculumVersions: ImportLevelCounts;
    strands: ImportLevelCounts;
    subStrands: ImportLevelCounts;
    contentStandards: ImportLevelCounts;
    learningOutcomes: ImportLevelCounts;
    learningIndicators: ImportLevelCounts;
  };
  issues: ImportIssue[];
  /** True only when there are zero error-severity issues; commit is refused otherwise. */
  canCommit: boolean;
}

export interface ImportCommitResult {
  counts: ImportPreview["counts"];
}

export type ImportFormat = "csv" | "json";

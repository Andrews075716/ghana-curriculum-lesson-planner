/**
 * Shape of the Phase 9 curriculum-extraction JSON files under
 * `data/curriculum/<subject>.json` — distinct from `./types.ts`
 * (`CurriculumTreeInput`), which is the hand-entry/admin CSV-JSON upload
 * shape. The two differ in real ways beyond field names:
 *
 *  - Extraction files nest `contentStandards` INSIDE `learningOutcomes`
 *    (`subStrand.learningOutcomes[].contentStandards[]`); the DB schema
 *    (and `CurriculumTreeInput`) has it the other way round, Content
 *    Standard as the parent. `extraction-importer.ts` re-derives the
 *    correct direction — see its module doc for exactly how and which
 *    subjects it refuses to import automatically.
 *  - `classLevel` lives on the Sub-Strand, not the Strand (a single Strand
 *    object in one of these files can contain Sub-Strands from more than
 *    one class level — confirmed inconsistent across subjects, so the
 *    importer never assumes a 1 Strand : 1 ClassLevel file shape).
 *  - Carries per-node extraction/review status, free-text review notes,
 *    source page provenance, and official Category B guidance text that
 *    `CurriculumTreeInput` has no fields for at all.
 */

export interface ExtractionSource {
  page?: number;
  pdfPageIndex?: number;
}

export type ExtractionNodeStatus = "EXTRACTED" | "NEEDS_REVIEW" | "REJECTED" | string;
export type ExtractionReviewStatus = "PENDING" | "APPROVED" | "REJECTED" | "NEEDS_REVIEW" | string;

export interface ExtractionGuidance {
  twentyFirstCenturySkills?: string;
  gesi?: string;
  sel?: string;
  nationalCoreValues?: string[];
}

export interface ExtractionAssessment {
  code?: string;
  dokLevels?: number[];
  dokDescriptions?: string[];
}

export interface ExtractionLearningIndicator {
  code?: string | null;
  description: string;
  sequence: number;
  source?: ExtractionSource;
  pedagogicalExemplars?: string[];
  assessment?: ExtractionAssessment;
  extractionStatus?: ExtractionNodeStatus;
  reviewStatus?: ExtractionReviewStatus;
  reviewNote?: string;
}

export interface ExtractionContentStandard {
  code?: string | null;
  description: string;
  sequence: number;
  source?: ExtractionSource;
  teachingLearningResources?: string[];
  learningIndicators: ExtractionLearningIndicator[];
  extractionStatus?: ExtractionNodeStatus;
  reviewStatus?: ExtractionReviewStatus;
  reviewNote?: string;
}

export interface ExtractionLearningOutcome {
  code?: string | null;
  description: string;
  sequence: number;
  source?: ExtractionSource;
  guidance?: ExtractionGuidance;
  /** Absent entirely (not just empty) in some files for a Learning Outcome the source prints with no Content Standard nested under it — treat as 0, same as `[]`. */
  contentStandards?: ExtractionContentStandard[];
  extractionStatus?: ExtractionNodeStatus;
  reviewStatus?: ExtractionReviewStatus;
  reviewNote?: string;
}

export interface ExtractionSubStrand {
  name: string;
  code?: string | null;
  sequence: number;
  /** Absent in the minority of files that carry classLevel on the Strand instead — see `ExtractionStrand.classLevel`. */
  classLevel?: string;
  source?: ExtractionSource;
  teachingLearningResources?: string[];
  learningOutcomes: ExtractionLearningOutcome[];
  extractionStatus?: ExtractionNodeStatus;
  reviewStatus?: ExtractionReviewStatus;
  reviewNote?: string;
}

export interface ExtractionStrand {
  name: string;
  code?: string | null;
  sequence: number;
  pathway?: string | null;
  /** Only present in the minority of files that duplicate the Strand wrapper per year; most files carry classLevel on the Sub-Strand instead. */
  classLevel?: string;
  subStrands: ExtractionSubStrand[];
}

export interface ExtractionCurriculumFile {
  subject: { name: string; code?: string | null; sourceDocument?: string };
  curriculumVersion: { name: string; year?: number; issuingAuthority?: string };
  classLevels: string[];
  extractionNotes?: string[];
  strands: ExtractionStrand[];
}

/** One outcome per DB node the importer touched, for the run's report. */
export type ImportAction = "created" | "updated" | "unchanged";

export interface ExtractionImportCounts {
  subjects: Record<ImportAction, number>;
  classLevels: Record<ImportAction, number>;
  curriculumVersions: Record<ImportAction, number>;
  strands: Record<ImportAction, number>;
  subStrands: Record<ImportAction, number>;
  contentStandards: Record<ImportAction, number>;
  learningOutcomes: Record<ImportAction, number>;
  learningIndicators: Record<ImportAction, number>;
  /** LearningOutcomeContentStandardLink rows — additional, non-primary CS/LO relationships. See extraction-importer.ts module doc. */
  additionalContentStandardLinks: Record<ImportAction, number>;
}

/** One Learning Outcome excluded from import because its Content Standard count couldn't be safely resolved. See extraction-importer.ts module doc. */
export interface ExtractionExcludedLearningOutcome {
  code: string | null;
  description: string;
  subStrand: string;
  classLevel: string;
  reason: string;
}

export interface ExtractionImportResult {
  subjectName: string;
  counts: ExtractionImportCounts;
  needsReviewCount: number;
  codeDisambiguations: string[];
  /** Learning Outcomes NOT imported (under any Content Standard, real or invented) because their Content Standard count was ambiguous — reported for human review, never silently dropped. */
  excludedLearningOutcomes: ExtractionExcludedLearningOutcome[];
  skipped: boolean;
  skipReason?: string;
}

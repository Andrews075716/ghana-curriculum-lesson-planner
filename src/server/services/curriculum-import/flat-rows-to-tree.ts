import type {
  ContentStandardInput,
  CurriculumTreeInput,
  ImportIssue,
  LearningOutcomeInput,
  StrandInput,
  SubStrandInput,
} from "./types";

/**
 * Column names for the flat, denormalized CSV format: one row per Learning
 * Indicator, with a column for every ancestor field. All of these are
 * required on every row — including the four `code` columns, which are the
 * stable identity used for duplicate detection and idempotent re-import
 * (matching the DB's unique `code` constraints on Strand/SubStrand/
 * ContentStandard/LearningIndicator). Learning Outcome has no code, same
 * as the underlying schema — its identity is its position (sequence)
 * under its parent Content Standard.
 */
const REQUIRED_COLUMNS = [
  "subjectCode",
  "subjectName",
  "classLevelName",
  "classLevelSequence",
  "curriculumVersionName",
  "strandCode",
  "strandName",
  "strandSequence",
  "subStrandCode",
  "subStrandName",
  "subStrandSequence",
  "contentStandardCode",
  "contentStandardDescription",
  "contentStandardSequence",
  "learningOutcomeDescription",
  "learningOutcomeSequence",
  "learningIndicatorCode",
  "learningIndicatorDescription",
  "learningIndicatorSequence",
] as const;

const SEQUENCE_COLUMNS = [
  "classLevelSequence",
  "strandSequence",
  "subStrandSequence",
  "contentStandardSequence",
  "learningOutcomeSequence",
  "learningIndicatorSequence",
] as const;

export const CSV_REQUIRED_COLUMNS: readonly string[] = REQUIRED_COLUMNS;

function parsePositiveInt(value: string): number | null {
  if (!/^\d+$/.test(value.trim())) return null;
  const n = Number.parseInt(value.trim(), 10);
  return n > 0 ? n : null;
}

function normalizeStatus(value: string | undefined): "DRAFT" | "ACTIVE" | "ARCHIVED" | undefined {
  const v = value?.trim().toUpperCase();
  if (v === "DRAFT" || v === "ACTIVE" || v === "ARCHIVED") return v;
  return undefined;
}

/**
 * Groups flat CSV rows into one or more `CurriculumTreeInput` trees
 * (grouped by subject+classLevel+curriculumVersion), validating that every
 * repeated reference to the same code agrees on that node's other fields.
 * Structural rules that also apply to native JSON input (required fields,
 * positive sequences, duplicate codes) are re-checked by `validateTree`
 * afterwards — this function focuses on the CSV-specific flattening and
 * the in-file consistency of repeated ancestor rows.
 */
export function flatRowsToTrees(rows: Record<string, string>[]): {
  trees: CurriculumTreeInput[];
  issues: ImportIssue[];
} {
  const issues: ImportIssue[] = [];
  const treesByKey = new Map<string, CurriculumTreeInput>();
  const strandsByCode = new Map<string, StrandInput>();
  const subStrandsByCode = new Map<string, SubStrandInput>();
  const contentStandardsByCode = new Map<string, ContentStandardInput>();
  const outcomesByKey = new Map<string, LearningOutcomeInput>();
  const indicatorCodesSeen = new Set<string>();

  rows.forEach((row, index) => {
    const rowNum = index + 2; // header is row 1

    const missing = REQUIRED_COLUMNS.filter((col) => !row[col] || row[col].trim() === "");
    if (missing.length > 0) {
      issues.push({
        severity: "error",
        path: `row ${rowNum}`,
        message: `Missing required column(s): ${missing.join(", ")}.`,
      });
      return;
    }

    const sequences: Record<string, number | null> = {};
    let hasBadSequence = false;
    for (const col of SEQUENCE_COLUMNS) {
      const n = parsePositiveInt(row[col]);
      sequences[col] = n;
      if (n === null) hasBadSequence = true;
    }
    if (hasBadSequence) {
      const bad = SEQUENCE_COLUMNS.filter((c) => sequences[c] === null);
      issues.push({
        severity: "error",
        path: `row ${rowNum}`,
        message: `Column(s) must be a positive whole number: ${bad.join(", ")}.`,
      });
      return;
    }

    const subjectCode = row.subjectCode.trim();
    const subjectName = row.subjectName.trim();
    const classLevelName = row.classLevelName.trim();
    const curriculumVersionName = row.curriculumVersionName.trim();
    const treeKey = `${subjectCode}|${classLevelName}|${curriculumVersionName}`;

    let tree = treesByKey.get(treeKey);
    if (!tree) {
      tree = {
        subject: { code: subjectCode, name: subjectName },
        classLevel: { name: classLevelName, sequence: sequences.classLevelSequence! },
        curriculumVersion: {
          name: curriculumVersionName,
          year: row.curriculumVersionYear?.trim()
            ? (parsePositiveInt(row.curriculumVersionYear) ?? undefined)
            : undefined,
          status: normalizeStatus(row.curriculumVersionStatus),
        },
        strands: [],
      };
      treesByKey.set(treeKey, tree);
    } else {
      if (tree.subject.name !== subjectName) {
        issues.push({
          severity: "error",
          path: `row ${rowNum}: subjectName`,
          message: `Subject "${subjectCode}" was already declared as "${tree.subject.name}"; this row says "${subjectName}".`,
        });
      }
      if (tree.classLevel.sequence !== sequences.classLevelSequence) {
        issues.push({
          severity: "error",
          path: `row ${rowNum}: classLevelSequence`,
          message: `Class level "${classLevelName}" was already declared with sequence ${tree.classLevel.sequence}; this row says ${sequences.classLevelSequence}.`,
        });
      }
    }

    const strandCode = row.strandCode.trim();
    let strand = strandsByCode.get(strandCode);
    if (!strand) {
      strand = {
        code: strandCode,
        name: row.strandName.trim(),
        sequence: sequences.strandSequence!,
        subStrands: [],
      };
      strandsByCode.set(strandCode, strand);
      tree.strands.push(strand);
    } else if (strand.name !== row.strandName.trim() || strand.sequence !== sequences.strandSequence) {
      issues.push({
        severity: "error",
        path: `row ${rowNum}: strandCode ${strandCode}`,
        message: `Strand "${strandCode}" was already declared as name="${strand.name}" sequence=${strand.sequence}; this row says name="${row.strandName.trim()}" sequence=${sequences.strandSequence}.`,
      });
    }

    const subStrandCode = row.subStrandCode.trim();
    let subStrand = subStrandsByCode.get(subStrandCode);
    if (!subStrand) {
      subStrand = {
        code: subStrandCode,
        name: row.subStrandName.trim(),
        sequence: sequences.subStrandSequence!,
        contentStandards: [],
      };
      subStrandsByCode.set(subStrandCode, subStrand);
      strand.subStrands.push(subStrand);
    } else if (
      subStrand.name !== row.subStrandName.trim() ||
      subStrand.sequence !== sequences.subStrandSequence
    ) {
      issues.push({
        severity: "error",
        path: `row ${rowNum}: subStrandCode ${subStrandCode}`,
        message: `Sub-strand "${subStrandCode}" was already declared as name="${subStrand.name}" sequence=${subStrand.sequence}; this row says name="${row.subStrandName.trim()}" sequence=${sequences.subStrandSequence}.`,
      });
    }

    const contentStandardCode = row.contentStandardCode.trim();
    let contentStandard = contentStandardsByCode.get(contentStandardCode);
    if (!contentStandard) {
      contentStandard = {
        code: contentStandardCode,
        description: row.contentStandardDescription.trim(),
        sequence: sequences.contentStandardSequence!,
        outcomes: [],
      };
      contentStandardsByCode.set(contentStandardCode, contentStandard);
      subStrand.contentStandards.push(contentStandard);
    } else if (
      contentStandard.description !== row.contentStandardDescription.trim() ||
      contentStandard.sequence !== sequences.contentStandardSequence
    ) {
      issues.push({
        severity: "error",
        path: `row ${rowNum}: contentStandardCode ${contentStandardCode}`,
        message: `Content standard "${contentStandardCode}" was already declared with different description or sequence.`,
      });
    }

    const outcomeKey = `${contentStandardCode}|${sequences.learningOutcomeSequence}`;
    let outcome = outcomesByKey.get(outcomeKey);
    if (!outcome) {
      outcome = {
        description: row.learningOutcomeDescription.trim(),
        sequence: sequences.learningOutcomeSequence!,
        indicators: [],
      };
      outcomesByKey.set(outcomeKey, outcome);
      contentStandard.outcomes.push(outcome);
    } else if (outcome.description !== row.learningOutcomeDescription.trim()) {
      issues.push({
        severity: "error",
        path: `row ${rowNum}: learningOutcomeSequence ${sequences.learningOutcomeSequence}`,
        message: `Learning outcome at sequence ${sequences.learningOutcomeSequence} under content standard "${contentStandardCode}" was already declared with a different description.`,
      });
    }

    const indicatorCode = row.learningIndicatorCode.trim();
    if (indicatorCodesSeen.has(indicatorCode)) {
      issues.push({
        severity: "error",
        path: `row ${rowNum}: learningIndicatorCode ${indicatorCode}`,
        message: `Learning indicator code "${indicatorCode}" appears on more than one row.`,
      });
    } else {
      indicatorCodesSeen.add(indicatorCode);
      outcome.indicators.push({
        code: indicatorCode,
        description: row.learningIndicatorDescription.trim(),
        sequence: sequences.learningIndicatorSequence!,
      });
    }
  });

  return { trees: [...treesByKey.values()], issues };
}

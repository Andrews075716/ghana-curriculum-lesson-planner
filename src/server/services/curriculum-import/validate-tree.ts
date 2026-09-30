import type { CurriculumTreeInput, ImportIssue } from "./types";

/**
 * Structural validation shared by both import formats: by the time trees
 * reach here, JSON input has already passed Zod schema parsing (required
 * fields/types) and CSV input has already been flattened with in-file
 * consistency checks (`flatRowsToTree`). This pass catches what both still
 * need: non-empty trimmed text, positive sequence numbers, sibling
 * sequence collisions (warning — confusing ordering, not a hard error),
 * and any code that repeats across the whole import batch (always an
 * error here, since a `CurriculumTreeInput` nests each node exactly
 * once — any duplicate means two different node objects claim the same
 * code).
 */
export function validateTrees(trees: CurriculumTreeInput[]): ImportIssue[] {
  const issues: ImportIssue[] = [];
  const seenCodes = new Map<string, string>(); // code -> first path that declared it

  function checkCode(code: string, path: string) {
    const prior = seenCodes.get(code);
    if (prior) {
      issues.push({
        severity: "error",
        path,
        message: `Code "${code}" is also used at ${prior} — codes must be unique across the whole import.`,
      });
    } else {
      seenCodes.set(code, path);
    }
  }

  function checkSequence(value: number, path: string) {
    if (!Number.isInteger(value) || value <= 0) {
      issues.push({ severity: "error", path, message: `Sequence must be a positive whole number, got ${value}.` });
    }
  }

  function checkSiblingSequences(sequences: number[], path: string) {
    const seen = new Set<number>();
    const dupes = new Set<number>();
    for (const s of sequences) {
      if (seen.has(s)) dupes.add(s);
      seen.add(s);
    }
    if (dupes.size > 0) {
      issues.push({
        severity: "warning",
        path,
        message: `Duplicate sequence number(s) among siblings: ${[...dupes].join(", ")}.`,
      });
    }
  }

  trees.forEach((tree, treeIndex) => {
    const treePath = `trees[${treeIndex}]`;

    if (!tree.subject.code.trim() || !tree.subject.name.trim()) {
      issues.push({ severity: "error", path: `${treePath}.subject`, message: "Subject code and name are required." });
    }
    if (!tree.classLevel.name.trim()) {
      issues.push({ severity: "error", path: `${treePath}.classLevel`, message: "Class level name is required." });
    }
    checkSequence(tree.classLevel.sequence, `${treePath}.classLevel.sequence`);
    if (!tree.curriculumVersion.name.trim()) {
      issues.push({
        severity: "error",
        path: `${treePath}.curriculumVersion`,
        message: "Curriculum version name is required.",
      });
    }

    checkSiblingSequences(
      tree.strands.map((s) => s.sequence),
      `${treePath}.strands`,
    );

    tree.strands.forEach((strand, strandIndex) => {
      const strandPath = `${treePath}.strands[${strandIndex}] (${strand.code || strand.name})`;
      if (!strand.code.trim() || !strand.name.trim()) {
        issues.push({ severity: "error", path: strandPath, message: "Strand code and name are required." });
      } else {
        checkCode(strand.code.trim(), strandPath);
      }
      checkSequence(strand.sequence, `${strandPath}.sequence`);
      checkSiblingSequences(
        strand.subStrands.map((s) => s.sequence),
        `${strandPath}.subStrands`,
      );

      strand.subStrands.forEach((subStrand, subStrandIndex) => {
        const subStrandPath = `${strandPath}.subStrands[${subStrandIndex}] (${subStrand.code || subStrand.name})`;
        if (!subStrand.code.trim() || !subStrand.name.trim()) {
          issues.push({ severity: "error", path: subStrandPath, message: "Sub-strand code and name are required." });
        } else {
          checkCode(subStrand.code.trim(), subStrandPath);
        }
        checkSequence(subStrand.sequence, `${subStrandPath}.sequence`);
        checkSiblingSequences(
          subStrand.contentStandards.map((c) => c.sequence),
          `${subStrandPath}.contentStandards`,
        );

        subStrand.contentStandards.forEach((cs, csIndex) => {
          const csPath = `${subStrandPath}.contentStandards[${csIndex}] (${cs.code || cs.description.slice(0, 30)})`;
          if (!cs.code.trim() || !cs.description.trim()) {
            issues.push({
              severity: "error",
              path: csPath,
              message: "Content standard code and description are required.",
            });
          } else {
            checkCode(cs.code.trim(), csPath);
          }
          checkSequence(cs.sequence, `${csPath}.sequence`);
          checkSiblingSequences(
            cs.outcomes.map((o) => o.sequence),
            `${csPath}.outcomes`,
          );

          cs.outcomes.forEach((outcome, outcomeIndex) => {
            const outcomePath = `${csPath}.outcomes[${outcomeIndex}]`;
            if (!outcome.description.trim()) {
              issues.push({ severity: "error", path: outcomePath, message: "Learning outcome description is required." });
            }
            checkSequence(outcome.sequence, `${outcomePath}.sequence`);
            checkSiblingSequences(
              outcome.indicators.map((i) => i.sequence),
              `${outcomePath}.indicators`,
            );

            outcome.indicators.forEach((indicator, indicatorIndex) => {
              const indicatorPath = `${outcomePath}.indicators[${indicatorIndex}] (${indicator.code || indicator.description.slice(0, 30)})`;
              if (!indicator.code.trim() || !indicator.description.trim()) {
                issues.push({
                  severity: "error",
                  path: indicatorPath,
                  message: "Learning indicator code and description are required.",
                });
              } else {
                checkCode(indicator.code.trim(), indicatorPath);
              }
              checkSequence(indicator.sequence, `${indicatorPath}.sequence`);
            });
          });
        });
      });
    });
  });

  return issues;
}

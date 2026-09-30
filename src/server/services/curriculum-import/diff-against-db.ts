import { prisma } from "@/server/db/prisma";
import type { CurriculumTreeInput, ImportIssue, ImportLevelCounts, ImportPreview } from "./types";

function emptyCounts(): ImportLevelCounts {
  return { create: 0, update: 0, unchanged: 0 };
}

function emptyCountsSet(): ImportPreview["counts"] {
  return {
    subjects: emptyCounts(),
    classLevels: emptyCounts(),
    curriculumVersions: emptyCounts(),
    strands: emptyCounts(),
    subStrands: emptyCounts(),
    contentStandards: emptyCounts(),
    learningOutcomes: emptyCounts(),
    learningIndicators: emptyCounts(),
  };
}

/**
 * Compares a validated, in-memory set of curriculum trees against the
 * database (read-only) to classify every node as create/update/unchanged
 * and to catch collisions a `code`-based upsert can't safely resolve on
 * its own — e.g. a subject name already used by a *different* subject
 * code. Used for both the import preview and, again, immediately before
 * commit (never trust a client-held preview).
 */
export async function diffAgainstDb(
  trees: CurriculumTreeInput[],
): Promise<{ counts: ImportPreview["counts"]; issues: ImportIssue[] }> {
  const issues: ImportIssue[] = [];
  const counts = emptyCountsSet();

  for (const tree of trees) {
    await diffSubject(tree, counts, issues);
    await diffClassLevel(tree, counts, issues);
    await diffCurriculumVersion(tree, counts, issues);

    const subject = await prisma.subject.findUnique({ where: { code: tree.subject.code } });
    const classLevel = await prisma.classLevel.findUnique({ where: { name: tree.classLevel.name } });
    const curriculumVersion = await prisma.curriculumVersion.findUnique({
      where: { name: tree.curriculumVersion.name },
    });

    for (const strandInput of tree.strands) {
      // findFirst, not findUnique-by-compound-key: `pathway` is nullable and
      // Prisma's generated compound-unique WhereUniqueInput doesn't accept
      // `null` for a nullable member of a compound key.
      const pathway = strandInput.pathway ?? null;
      const existingStrand =
        subject && classLevel && curriculumVersion
          ? await prisma.strand.findFirst({
              where: {
                subjectId: subject.id,
                classLevelId: classLevel.id,
                curriculumVersionId: curriculumVersion.id,
                pathway,
                code: strandInput.code,
              },
            })
          : null;
      if (!existingStrand) {
        counts.strands.create++;
      } else {
        const changed =
          existingStrand.name !== strandInput.name || existingStrand.sequence !== strandInput.sequence;
        counts.strands[changed ? "update" : "unchanged"]++;
      }

      for (const subStrandInput of strandInput.subStrands) {
        const existing = existingStrand
          ? await prisma.subStrand.findUnique({
              where: { strandId_code: { strandId: existingStrand.id, code: subStrandInput.code } },
            })
          : null;
        if (!existing) {
          counts.subStrands.create++;
        } else {
          const changed = existing.name !== subStrandInput.name || existing.sequence !== subStrandInput.sequence;
          counts.subStrands[changed ? "update" : "unchanged"]++;
        }

        for (const contentStandardInput of subStrandInput.contentStandards) {
          const existingCs = existing
            ? await prisma.contentStandard.findUnique({
                where: { subStrandId_code: { subStrandId: existing.id, code: contentStandardInput.code } },
              })
            : null;
          if (!existingCs) {
            counts.contentStandards.create++;
          } else {
            const changed =
              existingCs.description !== contentStandardInput.description ||
              existingCs.sequence !== contentStandardInput.sequence;
            counts.contentStandards[changed ? "update" : "unchanged"]++;
          }

          for (const outcomeInput of contentStandardInput.outcomes) {
            const existingOutcome = existingCs
              ? await prisma.learningOutcome.findFirst({
                  where: { contentStandardId: existingCs.id, sequence: outcomeInput.sequence },
                })
              : null;
            if (!existingOutcome) {
              counts.learningOutcomes.create++;
            } else {
              counts.learningOutcomes[
                existingOutcome.description !== outcomeInput.description ? "update" : "unchanged"
              ]++;
            }

            for (const indicatorInput of outcomeInput.indicators) {
              const existingIndicator = existingOutcome
                ? await prisma.learningIndicator.findUnique({
                    where: {
                      learningOutcomeId_code: { learningOutcomeId: existingOutcome.id, code: indicatorInput.code },
                    },
                  })
                : null;
              if (!existingIndicator) {
                counts.learningIndicators.create++;
              } else {
                const changed =
                  existingIndicator.description !== indicatorInput.description ||
                  existingIndicator.sequence !== indicatorInput.sequence;
                counts.learningIndicators[changed ? "update" : "unchanged"]++;
              }
            }
          }
        }
      }
    }
  }

  return { counts, issues };
}

async function diffSubject(
  tree: CurriculumTreeInput,
  counts: ImportPreview["counts"],
  issues: ImportIssue[],
): Promise<void> {
  const byCode = await prisma.subject.findUnique({ where: { code: tree.subject.code } });
  const byName = await prisma.subject.findUnique({ where: { name: tree.subject.name } });

  if (byName && (!byCode || byName.id !== byCode.id)) {
    issues.push({
      severity: "error",
      path: `subject ${tree.subject.code}`,
      message: `Subject name "${tree.subject.name}" is already used by a different subject (code "${byName.code}").`,
    });
    return;
  }

  if (!byCode) {
    counts.subjects.create++;
  } else {
    counts.subjects[byCode.name !== tree.subject.name ? "update" : "unchanged"]++;
  }
}

async function diffClassLevel(
  tree: CurriculumTreeInput,
  counts: ImportPreview["counts"],
  issues: ImportIssue[],
): Promise<void> {
  const byName = await prisma.classLevel.findUnique({ where: { name: tree.classLevel.name } });
  const bySequence = await prisma.classLevel.findUnique({ where: { sequence: tree.classLevel.sequence } });

  if (bySequence && (!byName || bySequence.id !== byName.id)) {
    issues.push({
      severity: "error",
      path: `classLevel ${tree.classLevel.name}`,
      message: `Class level sequence ${tree.classLevel.sequence} is already used by a different class level ("${bySequence.name}").`,
    });
    return;
  }

  if (!byName) {
    counts.classLevels.create++;
  } else {
    counts.classLevels[byName.sequence !== tree.classLevel.sequence ? "update" : "unchanged"]++;
  }
}

async function diffCurriculumVersion(
  tree: CurriculumTreeInput,
  counts: ImportPreview["counts"],
  _issues: ImportIssue[],
): Promise<void> {
  const existing = await prisma.curriculumVersion.findUnique({ where: { name: tree.curriculumVersion.name } });
  if (!existing) {
    counts.curriculumVersions.create++;
    return;
  }
  const status = tree.curriculumVersion.status ?? "DRAFT";
  const changed = existing.year !== (tree.curriculumVersion.year ?? null) || existing.status !== status;
  counts.curriculumVersions[changed ? "update" : "unchanged"]++;
}

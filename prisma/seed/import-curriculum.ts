import type { PrismaClient } from "@prisma/client";
import type { CurriculumTreeInput } from "./curriculum-types";

/**
 * Imports (or updates) one subject's full curriculum tree.
 *
 * Idempotent: re-running with the same data updates existing rows (matched
 * by their stable `code`, or by natural key where no code applies) instead
 * of duplicating them. This is the single entry point for curriculum data —
 * importing a new subject, class level, or curriculum version later means
 * writing a new data file under prisma/seed-data and passing it to this same
 * function. No changes to this file are needed to add more curriculum data.
 */
export async function importCurriculumTree(
  prisma: PrismaClient,
  input: CurriculumTreeInput,
) {
  const subject = await prisma.subject.upsert({
    where: { code: input.subject.code },
    update: { name: input.subject.name },
    create: { code: input.subject.code, name: input.subject.name },
  });

  const classLevel = await prisma.classLevel.upsert({
    where: { name: input.classLevel.name },
    update: { sequence: input.classLevel.sequence },
    create: {
      name: input.classLevel.name,
      sequence: input.classLevel.sequence,
    },
  });

  const curriculumVersion = await prisma.curriculumVersion.upsert({
    where: { name: input.curriculumVersion.name },
    update: {
      year: input.curriculumVersion.year,
      status: input.curriculumVersion.status ?? "DRAFT",
    },
    create: {
      name: input.curriculumVersion.name,
      year: input.curriculumVersion.year,
      status: input.curriculumVersion.status ?? "DRAFT",
    },
  });

  let strandCount = 0;
  let subStrandCount = 0;
  let contentStandardCount = 0;
  let learningOutcomeCount = 0;
  let learningIndicatorCount = 0;

  for (const strandInput of input.strands) {
    const existingStrand = await prisma.strand.findFirst({
      where: { code: strandInput.code },
    });
    const strand = existingStrand
      ? await prisma.strand.update({
          where: { id: existingStrand.id },
          data: { name: strandInput.name, sequence: strandInput.sequence },
        })
      : await prisma.strand.create({
          data: {
            code: strandInput.code,
            name: strandInput.name,
            sequence: strandInput.sequence,
            subjectId: subject.id,
            classLevelId: classLevel.id,
            curriculumVersionId: curriculumVersion.id,
          },
        });
    strandCount++;

    for (const subStrandInput of strandInput.subStrands) {
      const existingSubStrand = await prisma.subStrand.findFirst({
        where: { code: subStrandInput.code },
      });
      const subStrand = existingSubStrand
        ? await prisma.subStrand.update({
            where: { id: existingSubStrand.id },
            data: {
              name: subStrandInput.name,
              sequence: subStrandInput.sequence,
            },
          })
        : await prisma.subStrand.create({
            data: {
              code: subStrandInput.code,
              name: subStrandInput.name,
              sequence: subStrandInput.sequence,
              strandId: strand.id,
            },
          });
      subStrandCount++;

      for (const contentStandardInput of subStrandInput.contentStandards) {
        const existingContentStandard = await prisma.contentStandard.findFirst(
          { where: { code: contentStandardInput.code } },
        );
        const contentStandard = existingContentStandard
          ? await prisma.contentStandard.update({
              where: { id: existingContentStandard.id },
              data: {
                description: contentStandardInput.description,
                sequence: contentStandardInput.sequence,
              },
            })
          : await prisma.contentStandard.create({
              data: {
                code: contentStandardInput.code,
                description: contentStandardInput.description,
                sequence: contentStandardInput.sequence,
                subStrandId: subStrand.id,
              },
            });
        contentStandardCount++;

        for (const outcomeInput of contentStandardInput.outcomes) {
          const existingOutcome = await prisma.learningOutcome.findFirst({
            where: {
              contentStandardId: contentStandard.id,
              sequence: outcomeInput.sequence,
            },
          });
          const outcome = existingOutcome
            ? await prisma.learningOutcome.update({
                where: { id: existingOutcome.id },
                data: { description: outcomeInput.description },
              })
            : await prisma.learningOutcome.create({
                data: {
                  description: outcomeInput.description,
                  sequence: outcomeInput.sequence,
                  contentStandardId: contentStandard.id,
                },
              });
          learningOutcomeCount++;

          for (const indicatorInput of outcomeInput.indicators) {
            const existingIndicator = await prisma.learningIndicator.findFirst(
              { where: { code: indicatorInput.code } },
            );
            if (existingIndicator) {
              await prisma.learningIndicator.update({
                where: { id: existingIndicator.id },
                data: {
                  description: indicatorInput.description,
                  sequence: indicatorInput.sequence,
                },
              });
            } else {
              await prisma.learningIndicator.create({
                data: {
                  code: indicatorInput.code,
                  description: indicatorInput.description,
                  sequence: indicatorInput.sequence,
                  learningOutcomeId: outcome.id,
                },
              });
            }
            learningIndicatorCount++;
          }
        }
      }
    }
  }

  return {
    subject,
    classLevel,
    curriculumVersion,
    counts: {
      strands: strandCount,
      subStrands: subStrandCount,
      contentStandards: contentStandardCount,
      learningOutcomes: learningOutcomeCount,
      learningIndicators: learningIndicatorCount,
    },
  };
}

import type { Prisma } from "@prisma/client";
import type { CurriculumTreeInput } from "./types";

type TxClient = Prisma.TransactionClient;

/**
 * Imports (or updates) one subject's full curriculum tree. Idempotent:
 * re-running with the same data updates existing rows (matched by their
 * stable `code`, now DB-unique) instead of duplicating them.
 *
 * Must run inside a `prisma.$transaction(...)` callback — the caller (the
 * admin commit-import service, or a seed script) owns the transaction
 * boundary so a partial failure can never leave the DB half-updated.
 *
 * Returns no counts: the accurate create/update/unchanged breakdown shown
 * to the admin is computed once, up front, by `diffAgainstDb` (used for
 * both the preview and — immediately before this runs — the commit path),
 * so it isn't re-derived here from Prisma's upsert results.
 */
export async function commitCurriculumTree(
  tx: TxClient,
  input: CurriculumTreeInput,
): Promise<void> {
  const subject = await tx.subject.upsert({
    where: { code: input.subject.code },
    update: { name: input.subject.name },
    create: { code: input.subject.code, name: input.subject.name },
  });

  const classLevel = await tx.classLevel.upsert({
    where: { name: input.classLevel.name },
    update: { sequence: input.classLevel.sequence },
    create: { name: input.classLevel.name, sequence: input.classLevel.sequence },
  });

  const curriculumVersion = await tx.curriculumVersion.upsert({
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

  for (const strandInput of input.strands) {
    // findFirst + create/update, not upsert-by-compound-key: `pathway` is
    // nullable and Prisma's generated compound-unique WhereUniqueInput
    // doesn't accept `null` for a nullable member of a compound key.
    const pathway = strandInput.pathway ?? null;
    const existingStrand = await tx.strand.findFirst({
      where: {
        subjectId: subject.id,
        classLevelId: classLevel.id,
        curriculumVersionId: curriculumVersion.id,
        pathway,
        code: strandInput.code,
      },
    });
    const strand = existingStrand
      ? await tx.strand.update({
          where: { id: existingStrand.id },
          data: { name: strandInput.name, sequence: strandInput.sequence },
        })
      : await tx.strand.create({
          data: {
            code: strandInput.code,
            name: strandInput.name,
            sequence: strandInput.sequence,
            pathway,
            subjectId: subject.id,
            classLevelId: classLevel.id,
            curriculumVersionId: curriculumVersion.id,
          },
        });

    for (const subStrandInput of strandInput.subStrands) {
      const subStrand = await tx.subStrand.upsert({
        where: { strandId_code: { strandId: strand.id, code: subStrandInput.code } },
        update: { name: subStrandInput.name, sequence: subStrandInput.sequence },
        create: {
          code: subStrandInput.code,
          name: subStrandInput.name,
          sequence: subStrandInput.sequence,
          strandId: strand.id,
        },
      });

      for (const contentStandardInput of subStrandInput.contentStandards) {
        const contentStandard = await tx.contentStandard.upsert({
          where: { subStrandId_code: { subStrandId: subStrand.id, code: contentStandardInput.code } },
          update: {
            description: contentStandardInput.description,
            sequence: contentStandardInput.sequence,
          },
          create: {
            code: contentStandardInput.code,
            description: contentStandardInput.description,
            sequence: contentStandardInput.sequence,
            subStrandId: subStrand.id,
          },
        });

        for (const outcomeInput of contentStandardInput.outcomes) {
          const existingOutcome = await tx.learningOutcome.findFirst({
            where: { contentStandardId: contentStandard.id, sequence: outcomeInput.sequence },
          });
          const outcome = existingOutcome
            ? await tx.learningOutcome.update({
                where: { id: existingOutcome.id },
                data: { description: outcomeInput.description },
              })
            : await tx.learningOutcome.create({
                data: {
                  description: outcomeInput.description,
                  sequence: outcomeInput.sequence,
                  contentStandardId: contentStandard.id,
                },
              });

          for (const indicatorInput of outcomeInput.indicators) {
            await tx.learningIndicator.upsert({
              where: { learningOutcomeId_code: { learningOutcomeId: outcome.id, code: indicatorInput.code } },
              update: {
                description: indicatorInput.description,
                sequence: indicatorInput.sequence,
              },
              create: {
                code: indicatorInput.code,
                description: indicatorInput.description,
                sequence: indicatorInput.sequence,
                learningOutcomeId: outcome.id,
              },
            });
          }
        }
      }
    }
  }
}

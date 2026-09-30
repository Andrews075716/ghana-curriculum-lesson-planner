import { PrismaClient } from "@prisma/client";

/**
 * Verification tool: prints row counts and a full curriculum tree for a
 * given subject/class level, to sanity-check imported data and relationships.
 *
 * Usage: npx tsx scripts/print-curriculum-tree.ts
 */
const prisma = new PrismaClient();

async function main() {
  const [
    subjects,
    classLevels,
    curriculumVersions,
    strands,
    subStrands,
    contentStandards,
    learningOutcomes,
    learningIndicators,
  ] = await Promise.all([
    prisma.subject.count(),
    prisma.classLevel.count(),
    prisma.curriculumVersion.count(),
    prisma.strand.count(),
    prisma.subStrand.count(),
    prisma.contentStandard.count(),
    prisma.learningOutcome.count(),
    prisma.learningIndicator.count(),
  ]);

  console.log("Row counts:");
  console.table({
    subjects,
    classLevels,
    curriculumVersions,
    strands,
    subStrands,
    contentStandards,
    learningOutcomes,
    learningIndicators,
  });

  const subject = await prisma.subject.findUnique({
    where: { code: "COMP" },
    include: {
      strands: {
        orderBy: { sequence: "asc" },
        include: {
          classLevel: true,
          curriculumVersion: true,
          subStrands: {
            orderBy: { sequence: "asc" },
            include: {
              contentStandards: {
                orderBy: { sequence: "asc" },
                include: {
                  learningOutcomes: {
                    orderBy: { sequence: "asc" },
                    include: {
                      learningIndicators: { orderBy: { sequence: "asc" } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!subject) {
    console.log("No subject found with code COMP.");
    return;
  }

  console.log(`\n${subject.name} (code: ${subject.code})`);
  for (const strand of subject.strands) {
    console.log(
      `\n  Strand [${strand.code}] ${strand.name}  (class level: ${strand.classLevel.name}; curriculum version: ${strand.curriculumVersion.name}, status: ${strand.curriculumVersion.status})`,
    );
    for (const subStrand of strand.subStrands) {
      console.log(`    Sub-Strand [${subStrand.code}] ${subStrand.name}`);
      for (const cs of subStrand.contentStandards) {
        console.log(`      Content Standard [${cs.code}] ${cs.description}`);
        for (const outcome of cs.learningOutcomes) {
          console.log(`        Learning Outcome: ${outcome.description}`);
          for (const indicator of outcome.learningIndicators) {
            console.log(
              `          - [${indicator.code}] ${indicator.description}`,
            );
          }
        }
      }
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

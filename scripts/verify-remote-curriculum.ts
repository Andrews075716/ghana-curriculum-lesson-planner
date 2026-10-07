import { PrismaClient } from "@prisma/client";

/**
 * READ-ONLY verification of the curriculum hierarchy against the database
 * `DATABASE_URL` currently points at. Issues SELECT/count/groupBy queries
 * only — no create, update, delete, or upsert anywhere in this file.
 *
 * Usage: npx tsx scripts/verify-remote-curriculum.ts
 */

const prisma = new PrismaClient();

/**
 * Verified production baseline: deterministically reproduced by running the
 * current importer (src/server/services/curriculum-import/extraction-importer.ts)
 * against the current 33 committed data/curriculum/*.json files, and confirmed
 * to match the remote database exactly. Superseded the earlier 1083/1157/3070
 * figures recorded during local development — see
 * data/curriculum/extraction-progress.json's "productionBaselineReconciliation"
 * entry for the full reconciliation evidence (102/102 local-only Learning
 * Indicators traced to pre-correction Learning Outcome placements, 0 content
 * loss identified; the remaining 13 to the obsolete local-only
 * "Reference Sample - Computing" seed fixture, not part of this pipeline).
 */
const EXPECTED = {
  curriculumVersions: 1,
  subjects: 33,
  classLevels: 3,
  strands: 350,
  subStrands: 783,
  contentStandards: 1079,
  learningOutcomes: 1151,
  learningIndicators: 2955,
  additionalCsLoLinks: 35,
} as const;

function report(label: string, actual: number, expected: number) {
  const pass = actual === expected;
  console.log(`${pass ? "PASS" : "FAIL"}  ${label}: expected ${expected}, got ${actual}`);
  return pass;
}

function reportZero(label: string, actual: number) {
  const pass = actual === 0;
  console.log(`${pass ? "PASS" : "FAIL"}  ${label}: expected 0, got ${actual}`);
  return pass;
}

async function main() {
  let allPass = true;

  const [
    curriculumVersions,
    subjects,
    classLevels,
    strands,
    subStrands,
    contentStandards,
    learningOutcomes,
    learningIndicators,
    additionalCsLoLinks,
  ] = await Promise.all([
    prisma.curriculumVersion.count(),
    prisma.subject.count(),
    prisma.classLevel.count(),
    prisma.strand.count(),
    prisma.subStrand.count(),
    prisma.contentStandard.count(),
    prisma.learningOutcome.count(),
    prisma.learningIndicator.count(),
    prisma.learningOutcomeContentStandardLink.count(),
  ]);

  console.log("=== Core counts vs. expected baseline ===");
  allPass = report("Curriculum Versions", curriculumVersions, EXPECTED.curriculumVersions) && allPass;
  allPass = report("Subjects", subjects, EXPECTED.subjects) && allPass;
  allPass = report("Class Levels", classLevels, EXPECTED.classLevels) && allPass;
  allPass = report("Strands", strands, EXPECTED.strands) && allPass;
  allPass = report("Sub-Strands", subStrands, EXPECTED.subStrands) && allPass;
  allPass = report("Content Standards", contentStandards, EXPECTED.contentStandards) && allPass;
  allPass = report("Learning Outcomes", learningOutcomes, EXPECTED.learningOutcomes) && allPass;
  allPass = report("Learning Indicators", learningIndicators, EXPECTED.learningIndicators) && allPass;
  allPass = report("Additional CS-LO links", additionalCsLoLinks, EXPECTED.additionalCsLoLinks) && allPass;

  console.log("\n=== Referential integrity (orphan checks) ===");
  const [orphanCS] = await prisma.$queryRaw<{ n: bigint }[]>`
    SELECT COUNT(*)::bigint AS n
    FROM content_standards cs
    LEFT JOIN sub_strands ss ON ss.id = cs.sub_strand_id
    WHERE ss.id IS NULL
  `;
  const [orphanLO] = await prisma.$queryRaw<{ n: bigint }[]>`
    SELECT COUNT(*)::bigint AS n
    FROM learning_outcomes lo
    LEFT JOIN content_standards cs ON cs.id = lo.content_standard_id
    WHERE cs.id IS NULL
  `;
  const [orphanLI] = await prisma.$queryRaw<{ n: bigint }[]>`
    SELECT COUNT(*)::bigint AS n
    FROM learning_indicators li
    LEFT JOIN learning_outcomes lo ON lo.id = li.learning_outcome_id
    WHERE lo.id IS NULL
  `;
  allPass = reportZero("Orphan Content Standards (no parent Sub-Strand)", Number(orphanCS.n)) && allPass;
  allPass = reportZero("Orphan Learning Outcomes (no parent Content Standard)", Number(orphanLO.n)) && allPass;
  allPass = reportZero("Orphan Learning Indicators (no parent Learning Outcome)", Number(orphanLI.n)) && allPass;

  console.log("\n=== Duplicate checks (per the application's own uniqueness rule: code is scoped to its parent, not global) ===");
  const dupContentStandardCodes = await prisma.$queryRaw<{ sub_strand_id: string; code: string; n: bigint }[]>`
    SELECT sub_strand_id, code, COUNT(*)::bigint AS n
    FROM content_standards
    WHERE code IS NOT NULL
    GROUP BY sub_strand_id, code
    HAVING COUNT(*) > 1
  `;
  const dupLearningOutcomeCodes = await prisma.$queryRaw<{ content_standard_id: string; code: string; n: bigint }[]>`
    SELECT content_standard_id, code, COUNT(*)::bigint AS n
    FROM learning_outcomes
    WHERE code IS NOT NULL
    GROUP BY content_standard_id, code
    HAVING COUNT(*) > 1
  `;
  const dupJunctionPairs = await prisma.$queryRaw<{ learning_outcome_id: string; content_standard_id: string; n: bigint }[]>`
    SELECT learning_outcome_id, content_standard_id, COUNT(*)::bigint AS n
    FROM learning_outcome_content_standard_links
    GROUP BY learning_outcome_id, content_standard_id
    HAVING COUNT(*) > 1
  `;
  allPass = reportZero("Duplicate Content Standard codes (same sub_strand_id + code)", dupContentStandardCodes.length) && allPass;
  allPass = reportZero("Duplicate Learning Outcome codes (same content_standard_id + code)", dupLearningOutcomeCodes.length) && allPass;
  allPass = reportZero("Duplicate junction pairs (learning_outcome_id + content_standard_id)", dupJunctionPairs.length) && allPass;

  if (dupContentStandardCodes.length > 0) console.log("  Content Standard duplicates:", dupContentStandardCodes);
  if (dupLearningOutcomeCodes.length > 0) console.log("  Learning Outcome duplicates:", dupLearningOutcomeCodes);
  if (dupJunctionPairs.length > 0) console.log("  Junction duplicates:", dupJunctionPairs);

  console.log(`\n=== Overall: ${allPass ? "PASS" : "FAIL"} ===`);
  if (!allPass) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

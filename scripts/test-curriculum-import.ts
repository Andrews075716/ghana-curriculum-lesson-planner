import { PrismaClient } from "@prisma/client";
import { loginAsDemoAdmin } from "./_lib/authed-session";

/**
 * Verifies the CSV/JSON curriculum import pipeline end to end against the
 * live dev server: hierarchy validation, duplicate detection (both within
 * a file and against existing DB rows), the preview-before-commit
 * contract (nothing is written until a clean preview is explicitly
 * committed, and commit re-validates rather than trusting the client),
 * and idempotent re-import.
 *
 *   npx tsx scripts/test-curriculum-import.ts
 */
const prisma = new PrismaClient();
const TAG = `TESTIMPORT-${Date.now()}`;

let passed = 0;
let failed = 0;

function assert(condition: unknown, message: string): void {
  if (condition) {
    passed++;
    console.log(`  ok - ${message}`);
  } else {
    failed++;
    console.error(`  FAIL - ${message}`);
  }
}

async function cleanup() {
  await prisma.learningIndicator.deleteMany({ where: { code: { startsWith: TAG } } });
  await prisma.learningOutcome.deleteMany({ where: { description: { startsWith: TAG } } });
  await prisma.contentStandard.deleteMany({ where: { code: { startsWith: TAG } } });
  await prisma.subStrand.deleteMany({ where: { code: { startsWith: TAG } } });
  await prisma.strand.deleteMany({ where: { code: { startsWith: TAG } } });
  await prisma.curriculumVersion.deleteMany({ where: { name: { startsWith: TAG } } });
  await prisma.classLevel.deleteMany({ where: { name: { startsWith: TAG } } });
  await prisma.subject.deleteMany({ where: { code: { startsWith: TAG } } });
}

function validJson() {
  return {
    subject: { code: `${TAG}-SUBJ`, name: `${TAG} Subject` },
    classLevel: { name: `${TAG} Class`, sequence: 9101 },
    curriculumVersion: { name: `${TAG} Version`, status: "DRAFT" },
    strands: [
      {
        code: `${TAG}-STR-01`,
        name: "Strand One",
        sequence: 1,
        subStrands: [
          {
            code: `${TAG}-SS-01`,
            name: "Sub-strand One",
            sequence: 1,
            contentStandards: [
              {
                code: `${TAG}-CS-01`,
                description: `${TAG} Content standard`,
                sequence: 1,
                outcomes: [
                  {
                    description: `${TAG} Outcome`,
                    sequence: 1,
                    indicators: [
                      { code: `${TAG}-LI-01`, description: `${TAG} Indicator one`, sequence: 1 },
                      { code: `${TAG}-LI-02`, description: `${TAG} Indicator two`, sequence: 2 },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  };
}

function validCsvRows(): string {
  const header =
    "subjectCode,subjectName,classLevelName,classLevelSequence,curriculumVersionName,curriculumVersionYear,curriculumVersionStatus,strandCode,strandName,strandSequence,subStrandCode,subStrandName,subStrandSequence,contentStandardCode,contentStandardDescription,contentStandardSequence,learningOutcomeDescription,learningOutcomeSequence,learningIndicatorCode,learningIndicatorDescription,learningIndicatorSequence";
  const csvSubject = `${TAG}-CSV-SUBJ`;
  const row = (indicatorCode: string, indicatorSeq: number, indicatorDesc: string) =>
    [
      csvSubject,
      `${TAG} CSV Subject`,
      `${TAG} CSV Class`,
      "9102",
      `${TAG} CSV Version`,
      "",
      "DRAFT",
      `${TAG}-CSV-STR-01`,
      "CSV Strand",
      "1",
      `${TAG}-CSV-SS-01`,
      "CSV Sub-strand",
      "1",
      `${TAG}-CSV-CS-01`,
      `${TAG} CSV Content standard`,
      "1",
      `${TAG} CSV Outcome`,
      "1",
      indicatorCode,
      indicatorDesc,
      String(indicatorSeq),
    ].join(",");
  return [
    header,
    row(`${TAG}-CSV-LI-01`, 1, "CSV Indicator one"),
    row(`${TAG}-CSV-LI-02`, 2, "CSV Indicator two"),
  ].join("\n");
}

async function main() {
  await cleanup();
  const admin = await loginAsDemoAdmin();

  console.log("1) Valid JSON import: preview shows all creates, canCommit true");
  const jsonTree = validJson();
  const jsonPreview = await admin.post("/api/admin/curriculum/import/preview", {
    format: "json",
    content: JSON.stringify(jsonTree),
  });
  assert(jsonPreview.status === 200, "preview JSON -> 200");
  assert(jsonPreview.body.data.canCommit === true, "canCommit is true for a clean import");
  assert(jsonPreview.body.data.counts.subjects.create === 1, "1 subject to create");
  assert(jsonPreview.body.data.counts.learningIndicators.create === 2, "2 indicators to create");
  assert(
    (await prisma.subject.count({ where: { code: jsonTree.subject.code } })) === 0,
    "preview did not write anything to the DB",
  );

  console.log("2) Commit the JSON import");
  const jsonCommit = await admin.post("/api/admin/curriculum/import/commit", {
    format: "json",
    content: JSON.stringify(jsonTree),
  });
  assert(jsonCommit.status === 200, "commit JSON -> 200");
  assert(
    (await prisma.subject.count({ where: { code: jsonTree.subject.code } })) === 1,
    "subject now exists in the DB",
  );
  assert(
    (await prisma.learningIndicator.count({ where: { code: { startsWith: `${TAG}-LI` } } })) === 2,
    "both indicators now exist in the DB",
  );

  console.log("3) Idempotent re-import: same data again -> all unchanged, zero new rows");
  const rePreview = await admin.post("/api/admin/curriculum/import/preview", {
    format: "json",
    content: JSON.stringify(jsonTree),
  });
  assert(rePreview.body.data.counts.subjects.unchanged === 1, "subject classified as unchanged");
  assert(
    rePreview.body.data.counts.learningIndicators.unchanged === 2,
    "both indicators classified as unchanged",
  );
  assert(
    rePreview.body.data.counts.learningIndicators.create === 0,
    "no new indicators would be created on re-import",
  );
  const indicatorCountBefore = await prisma.learningIndicator.count({
    where: { code: { startsWith: `${TAG}-LI` } },
  });
  const reCommit = await admin.post("/api/admin/curriculum/import/commit", {
    format: "json",
    content: JSON.stringify(jsonTree),
  });
  assert(reCommit.status === 200, "re-commit -> 200");
  const indicatorCountAfter = await prisma.learningIndicator.count({
    where: { code: { startsWith: `${TAG}-LI` } },
  });
  assert(indicatorCountBefore === indicatorCountAfter, "re-committing created no duplicate rows");

  console.log("4) Update via re-import: change a description, commit, verify it changed");
  const updatedTree = validJson();
  updatedTree.strands[0].subStrands[0].contentStandards[0].outcomes[0].indicators[0].description = `${TAG} Indicator one (updated)`;
  const updatePreview = await admin.post("/api/admin/curriculum/import/preview", {
    format: "json",
    content: JSON.stringify(updatedTree),
  });
  assert(updatePreview.body.data.counts.learningIndicators.update === 1, "1 indicator classified as update");
  const updateCommit = await admin.post("/api/admin/curriculum/import/commit", {
    format: "json",
    content: JSON.stringify(updatedTree),
  });
  assert(updateCommit.status === 200, "commit update -> 200");
  const updatedIndicator = await prisma.learningIndicator.findFirst({
    where: { code: `${TAG}-LI-01` },
  });
  assert(
    updatedIndicator?.description === `${TAG} Indicator one (updated)`,
    "indicator description was actually updated",
  );

  console.log("5) Hierarchy validation: missing required field -> error, canCommit false, nothing written");
  const missingFieldTree = validJson();
  missingFieldTree.subject.code = `${TAG}-MISSING`;
  missingFieldTree.strands[0].name = "";
  const missingFieldPreview = await admin.post("/api/admin/curriculum/import/preview", {
    format: "json",
    content: JSON.stringify(missingFieldTree),
  });
  assert(missingFieldPreview.status === 200, "preview with missing field still -> 200 (issues, not a crash)");
  assert(missingFieldPreview.body.data.canCommit === false, "canCommit is false when a required field is missing");
  assert(
    missingFieldPreview.body.data.issues.some((i: { severity: string }) => i.severity === "error"),
    "at least one error-severity issue is reported",
  );
  const missingFieldCommit = await admin.post("/api/admin/curriculum/import/commit", {
    format: "json",
    content: JSON.stringify(missingFieldTree),
  });
  assert(missingFieldCommit.status === 400, "commit with validation errors -> 400, refused");
  assert(
    (await prisma.subject.count({ where: { code: `${TAG}-MISSING` } })) === 0,
    "nothing was written for the invalid import",
  );

  console.log("6) In-file duplicate conflict: same code, different content on two nodes -> error");
  const conflictingTree = validJson();
  conflictingTree.subject.code = `${TAG}-CONFLICT`;
  conflictingTree.strands.push({
    ...JSON.parse(JSON.stringify(conflictingTree.strands[0])),
    name: "A different name for the same code",
  });
  const conflictPreview = await admin.post("/api/admin/curriculum/import/preview", {
    format: "json",
    content: JSON.stringify(conflictingTree),
  });
  assert(
    conflictPreview.body.data.issues.some((i: { message: string }) => i.message.includes("also used at")),
    "duplicate code with conflicting content is reported as an error",
  );
  assert(conflictPreview.body.data.canCommit === false, "canCommit is false for the in-file conflict");

  console.log("7) Against-DB conflict: subject name already used by a different code -> error");
  const nameCollisionTree = validJson();
  nameCollisionTree.subject.code = `${TAG}-DIFFERENT-CODE`;
  // Reuse the *name* of the subject already committed in step 2/4.
  nameCollisionTree.subject.name = jsonTree.subject.name;
  const collisionPreview = await admin.post("/api/admin/curriculum/import/preview", {
    format: "json",
    content: JSON.stringify(nameCollisionTree),
  });
  assert(
    collisionPreview.body.data.issues.some((i: { message: string }) => i.message.includes("already used by a different subject")),
    "subject name collision against a different code is reported",
  );
  assert(collisionPreview.body.data.canCommit === false, "canCommit is false for the name collision");

  console.log("8) Valid CSV import: preview + commit");
  const csvContent = validCsvRows();
  const csvPreview = await admin.post("/api/admin/curriculum/import/preview", {
    format: "csv",
    content: csvContent,
  });
  assert(csvPreview.status === 200, "preview CSV -> 200");
  assert(csvPreview.body.data.canCommit === true, "CSV preview canCommit true");
  assert(csvPreview.body.data.counts.learningIndicators.create === 2, "CSV: 2 indicators to create");
  const csvCommit = await admin.post("/api/admin/curriculum/import/commit", {
    format: "csv",
    content: csvContent,
  });
  assert(csvCommit.status === 200, "commit CSV -> 200");
  assert(
    (await prisma.learningIndicator.count({ where: { code: { startsWith: `${TAG}-CSV-LI` } } })) === 2,
    "CSV indicators now exist in the DB",
  );

  console.log("9) CSV with a missing required column -> validation error, nothing written");
  const badCsv = csvContent
    .split("\n")
    .map((line, i) => (i === 0 ? line : line.replace(/,[^,]*$/, ",")))
    .join("\n");
  const badCsvPreview = await admin.post("/api/admin/curriculum/import/preview", {
    format: "csv",
    content: badCsv,
  });
  assert(badCsvPreview.body.data.canCommit === false, "CSV with blanked-out required column -> canCommit false");

  console.log("10) CSV rows that disagree about a repeated strand's name -> in-file conflict error");
  const inconsistentCsv = [
    "subjectCode,subjectName,classLevelName,classLevelSequence,curriculumVersionName,curriculumVersionYear,curriculumVersionStatus,strandCode,strandName,strandSequence,subStrandCode,subStrandName,subStrandSequence,contentStandardCode,contentStandardDescription,contentStandardSequence,learningOutcomeDescription,learningOutcomeSequence,learningIndicatorCode,learningIndicatorDescription,learningIndicatorSequence",
    `${TAG}-INC,${TAG} Inc Subject,${TAG} Inc Class,9103,${TAG} Inc Version,,DRAFT,${TAG}-INC-STR,Strand A,1,${TAG}-INC-SS,Sub A,1,${TAG}-INC-CS,Desc,1,Outcome,1,${TAG}-INC-LI-01,Indicator A,1`,
    `${TAG}-INC,${TAG} Inc Subject,${TAG} Inc Class,9103,${TAG} Inc Version,,DRAFT,${TAG}-INC-STR,Strand B (different name),1,${TAG}-INC-SS,Sub A,1,${TAG}-INC-CS,Desc,1,Outcome,1,${TAG}-INC-LI-02,Indicator B,2`,
  ].join("\n");
  const inconsistentPreview = await admin.post("/api/admin/curriculum/import/preview", {
    format: "csv",
    content: inconsistentCsv,
  });
  assert(
    inconsistentPreview.body.data.issues.some((i: { message: string }) => i.message.includes("already declared")),
    "inconsistent repeated strand rows reported as an error",
  );
  assert(inconsistentPreview.body.data.canCommit === false, "canCommit false for inconsistent CSV rows");

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error("Test script crashed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await cleanup();
    await prisma.$disconnect();
  });

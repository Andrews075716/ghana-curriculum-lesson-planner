import { PrismaClient } from "@prisma/client";
import { loginAsDemoTeacher, AuthedSession } from "./_lib/authed-session";

/**
 * End-to-end test of the curriculum selection API: walks the full real
 * cascade (Subject -> ... -> Learning Indicator) using the seeded Computing
 * / Form 1 data, verifies the path-hydration endpoint resolves back to the
 * same chain, and checks the validation-error, not-found, and empty-result
 * branches. Every route but /subjects and /class-levels/all requires a
 * session (see those two routes' own doc comments for why they're the
 * deliberate exceptions), so this authenticates once up front. Run against
 * a live dev server + database:
 *
 *   npx tsx scripts/test-curriculum-api.ts
 */
const prisma = new PrismaClient();

let passed = 0;
let failed = 0;

function assert(condition: unknown, message: string): asserts condition {
  if (condition) {
    passed++;
    console.log(`  ok - ${message}`);
  } else {
    failed++;
    console.error(`  FAIL - ${message}`);
  }
}

interface Option {
  id: string;
  label: string;
}

async function main() {
  const session = await loginAsDemoTeacher();
  const getJson = session.get.bind(session);

  console.log("1) Subjects");
  const subjectsRes = await getJson("/api/curriculum/subjects");
  assert(subjectsRes.status === 200, "GET /subjects -> 200");
  const subjects: Option[] = subjectsRes.body.data;
  const computing = subjects.find((s) => s.label === "Computing");
  assert(computing, 'subjects includes "Computing"');
  if (!computing) throw new Error("Cannot continue without Computing subject");

  console.log("2) Class levels for Computing");
  const classLevelsRes = await getJson(
    `/api/curriculum/class-levels?subjectId=${computing.id}`,
  );
  assert(classLevelsRes.status === 200, "GET /class-levels -> 200");
  const classLevels: Option[] = classLevelsRes.body.data;
  const form1 = classLevels.find((c) => c.label === "SHS 1");
  assert(form1, 'class levels includes "SHS 1"');
  if (!form1) throw new Error("Cannot continue without SHS 1");

  console.log("3) Strands for Computing / SHS 1");
  const strandsRes = await getJson(
    `/api/curriculum/strands?subjectId=${computing.id}&classLevelId=${form1.id}`,
  );
  assert(strandsRes.status === 200, "GET /strands -> 200");
  const strands: Option[] = strandsRes.body.data;
  // >= 2, not === 2: Checkpoint 6 additionally imported the real Computing
  // curriculum's own SHS 1 strands alongside these 2 demo-seed ones (both
  // coexist under the same reused Subject/ClassLevel rows, matched below by
  // exact name so the real-data strands don't affect this test).
  assert(strands.length >= 2, `strands count is at least 2 (got ${strands.length})`);
  const strand1 = strands.find(
    (s) => s.label === "Computer Architecture and Organisation",
  );
  assert(strand1, "strand 1 is Computer Architecture and Organisation");
  if (!strand1) throw new Error("Cannot continue without strand 1");

  console.log("4) Sub-strands for strand 1");
  const subStrandsRes = await getJson(
    `/api/curriculum/sub-strands?strandId=${strand1.id}`,
  );
  assert(subStrandsRes.status === 200, "GET /sub-strands -> 200");
  const subStrands: Option[] = subStrandsRes.body.data;
  assert(
    subStrands.length === 3,
    `sub-strands count is 3 (got ${subStrands.length})`,
  );
  const subStrand1 = subStrands.find(
    (s) => s.label === "Data Storage and Manipulation",
  );
  assert(subStrand1, "sub-strand 1 is Data Storage and Manipulation");
  if (!subStrand1) throw new Error("Cannot continue without sub-strand 1");

  console.log("5) Content standards for sub-strand 1");
  const standardsRes = await getJson(
    `/api/curriculum/content-standards?subStrandId=${subStrand1.id}`,
  );
  assert(standardsRes.status === 200, "GET /content-standards -> 200");
  const standards: Option[] = standardsRes.body.data;
  assert(standards.length === 1, `content standards count is 1 (got ${standards.length})`);
  const standard1 = standards[0];

  console.log("6) Learning outcomes for content standard 1");
  const outcomesRes = await getJson(
    `/api/curriculum/learning-outcomes?contentStandardId=${standard1.id}`,
  );
  assert(outcomesRes.status === 200, "GET /learning-outcomes -> 200");
  const outcomes: Option[] = outcomesRes.body.data;
  assert(outcomes.length === 2, `learning outcomes count is 2 (got ${outcomes.length})`);
  const outcome1 = outcomes.find((o) =>
    o.label.startsWith("Apply computer architecture concepts"),
  );
  assert(outcome1, "outcome 1 matches expected description");
  if (!outcome1) throw new Error("Cannot continue without outcome 1");

  console.log("7) Learning indicators for outcome 1");
  const indicatorsRes = await getJson(
    `/api/curriculum/learning-indicators?learningOutcomeId=${outcome1.id}`,
  );
  assert(indicatorsRes.status === 200, "GET /learning-indicators -> 200");
  const indicators: Option[] = indicatorsRes.body.data;
  assert(indicators.length === 1, `indicators count is 1 (got ${indicators.length})`);
  const indicator1 = indicators[0];
  assert(
    // Checkpoint 7: labels are prefixed with the official code when the
    // node has one (this seed indicator does) — "<code> — <wording>".
    indicator1.label.endsWith("Describe data as bit patterns."),
    "indicator matches expected description",
  );
  assert(
    indicator1.label.startsWith("COMP-F1-STR-01-SS-01-CS-01-LI-01"),
    "indicator label is prefixed with its official code",
  );

  console.log("8) Path hydration for indicator 1 (preserve-selection)");
  const pathRes = await getJson(
    `/api/curriculum/learning-indicators/${indicator1.id}/path`,
  );
  assert(pathRes.status === 200, "GET /learning-indicators/:id/path -> 200");
  const path = pathRes.body.data;
  assert(path.subjectId === computing.id, "resolved path.subjectId matches");
  assert(path.classLevelId === form1.id, "resolved path.classLevelId matches");
  assert(path.strandId === strand1.id, "resolved path.strandId matches");
  assert(path.subStrandId === subStrand1.id, "resolved path.subStrandId matches");
  assert(path.contentStandardId === standard1.id, "resolved path.contentStandardId matches");
  assert(path.learningOutcomeId === outcome1.id, "resolved path.learningOutcomeId matches");
  assert(path.learningIndicatorId === indicator1.id, "resolved path.learningIndicatorId matches");

  console.log("9) Validation errors (missing required query params)");
  const missingParam = await getJson("/api/curriculum/class-levels");
  assert(missingParam.status === 400, "missing subjectId -> 400");
  assert(
    missingParam.body.error?.code === "VALIDATION_ERROR",
    "missing subjectId -> VALIDATION_ERROR code",
  );
  assert(
    Array.isArray(missingParam.body.error?.fieldErrors?.subjectId),
    "missing subjectId -> field error present",
  );

  console.log("10) Not-found errors (unknown parent ids)");
  const unknownSubject = await getJson(
    "/api/curriculum/class-levels?subjectId=does-not-exist",
  );
  assert(unknownSubject.status === 404, "unknown subjectId -> 404");
  assert(
    unknownSubject.body.error?.code === "NOT_FOUND",
    "unknown subjectId -> NOT_FOUND code",
  );

  const unknownStrand = await getJson(
    "/api/curriculum/sub-strands?strandId=does-not-exist",
  );
  assert(unknownStrand.status === 404, "unknown strandId -> 404");

  const unknownIndicatorPath = await getJson(
    "/api/curriculum/learning-indicators/does-not-exist/path",
  );
  assert(unknownIndicatorPath.status === 404, "unknown indicator id path -> 404");

  console.log("11) Empty result (valid parent, zero children) vs not-found");
  // A real strand with genuinely no sub-strands yet is not present in the
  // seed data (every branch is fully populated) - create one temporarily to
  // prove the API returns 200 + [] rather than 404 for this case.
  const tempStrand = await prisma.strand.create({
    data: {
      code: `TEST-EMPTY-${Date.now()}`,
      name: "Temporary Empty Test Strand",
      sequence: 999,
      subjectId: computing.id,
      classLevelId: form1.id,
      curriculumVersionId: (
        await prisma.strand.findFirstOrThrow({
          where: { id: strand1.id },
          select: { curriculumVersionId: true },
        })
      ).curriculumVersionId,
    },
  });

  try {
    const emptyRes = await getJson(
      `/api/curriculum/sub-strands?strandId=${tempStrand.id}`,
    );
    assert(emptyRes.status === 200, "valid strand with no sub-strands -> 200 (not 404)");
    assert(
      Array.isArray(emptyRes.body.data) && emptyRes.body.data.length === 0,
      "valid strand with no sub-strands -> empty array",
    );
  } finally {
    await prisma.strand.delete({ where: { id: tempStrand.id } });
  }

  console.log("12) Unauthenticated callers are rejected on the session-gated routes");
  const anon = new AuthedSession();
  const anonStrands = await anon.get(
    `/api/curriculum/strands?subjectId=${computing.id}&classLevelId=${form1.id}`,
  );
  assert(anonStrands.status === 403, `unauthenticated GET /strands -> 403 (got ${anonStrands.status})`);
  const anonSubjects = await anon.get("/api/curriculum/subjects");
  assert(anonSubjects.status === 200, "unauthenticated GET /subjects -> 200 (deliberately public)");

  console.log("13) Curriculum search (Curriculum browser)");
  const searchRes = await getJson(
    `/api/curriculum/search?subjectId=${computing.id}&classLevelId=${form1.id}&q=bit patterns`,
  );
  assert(searchRes.status === 200, "GET /search -> 200");
  const searchResults = searchRes.body.data as Array<{
    learningIndicatorId: string;
    learningIndicatorLabel: string;
    strandId: string;
    subStrandId: string;
    contentStandardId: string;
    learningOutcomeId: string;
  }>;
  assert(
    searchResults.some((r) => r.learningIndicatorId === indicator1.id),
    "search matches the known indicator by description text",
  );
  const match = searchResults.find((r) => r.learningIndicatorId === indicator1.id);
  assert(match?.strandId === strand1.id, "search result includes the correct strandId");
  assert(match?.subStrandId === subStrand1.id, "search result includes the correct subStrandId");
  assert(
    match?.contentStandardId === standard1.id,
    "search result includes the correct contentStandardId",
  );
  assert(
    match?.learningOutcomeId === outcome1.id,
    "search result includes the correct learningOutcomeId",
  );

  const noMatchRes = await getJson(
    `/api/curriculum/search?subjectId=${computing.id}&classLevelId=${form1.id}&q=zzz-no-such-text`,
  );
  assert(noMatchRes.status === 200, "search with no matches -> 200 (not error)");
  assert(
    Array.isArray(noMatchRes.body.data) && noMatchRes.body.data.length === 0,
    "search with no matches -> empty array",
  );

  const searchMissingParam = await getJson(
    `/api/curriculum/search?subjectId=${computing.id}&classLevelId=${form1.id}`,
  );
  assert(searchMissingParam.status === 400, "search missing q -> 400");

  const searchUnknownSubject = await getJson(
    `/api/curriculum/search?subjectId=does-not-exist&classLevelId=${form1.id}&q=bit`,
  );
  assert(searchUnknownSubject.status === 404, "search with unknown subjectId -> 404");

  const anonSearch = await anon.get(
    `/api/curriculum/search?subjectId=${computing.id}&classLevelId=${form1.id}&q=bit`,
  );
  assert(anonSearch.status === 403, "unauthenticated GET /search -> 403");

  console.log("14) Hybrid CS<->LO relationship (LearningOutcomeContentStandardLink) — Checkpoint 7");
  // Real, documented additional-link case from Checkpoint 6's import (see
  // docs/curriculum-junction-table-audit.md row 3/4): Agriculture SHS 1,
  // Sub-Strand "Modern Mechanized Agriculture", Learning Outcome 1.2.2.LO.1
  // has its own primary Content Standard 1.2.2.CS.1, but Content Standards
  // 1.2.2.CS.2 and 1.2.2.CS.3 are genuinely additional-only (no LO treats
  // either as primary) — so before the Checkpoint 7 fix, selecting either
  // of them returned zero Learning Outcomes.
  const additionalCs = await prisma.contentStandard.findFirst({
    where: {
      code: "1.2.2.CS.3",
      subStrand: {
        strand: { subject: { name: "Agriculture" }, classLevel: { name: "SHS 1" } },
      },
    },
    select: { id: true },
  });
  assert(additionalCs, "fixture: additional Content Standard 1.2.2.CS.3 exists in the imported data");
  if (!additionalCs) throw new Error("Cannot continue without the Agriculture fixture data");

  const linkRes = await getJson(
    `/api/curriculum/learning-outcomes?contentStandardId=${additionalCs.id}`,
  );
  assert(linkRes.status === 200, "GET /learning-outcomes for an ADDITIONAL content standard -> 200");
  const linkedOutcomes: Option[] = linkRes.body.data;
  assert(
    linkedOutcomes.length === 1,
    `additional content standard resolves to exactly 1 learning outcome (got ${linkedOutcomes.length})`,
  );
  const linkedOutcome = linkedOutcomes[0];
  assert(
    linkedOutcome?.label.includes("1.2.2.LO.1"),
    "the learning outcome reached via the ADDITIONAL relationship is 1.2.2.LO.1",
  );

  if (linkedOutcome) {
    console.log("    -> Additional CS -> LO -> LI (teacher-facing selector, full hybrid chain)");
    const linkedIndicatorsRes = await getJson(
      `/api/curriculum/learning-indicators?learningOutcomeId=${linkedOutcome.id}`,
    );
    assert(linkedIndicatorsRes.status === 200, "GET /learning-indicators for the linked LO -> 200");
    const linkedIndicators: Option[] = linkedIndicatorsRes.body.data;
    assert(
      linkedIndicators.length > 0,
      `linked learning outcome has learning indicators (got ${linkedIndicators.length})`,
    );
  }

  console.log("    -> Primary CS still resolves independently (fix doesn't touch the primary relationship)");
  const primaryCs = await prisma.contentStandard.findFirst({
    where: {
      code: "1.2.2.CS.1",
      subStrand: {
        strand: { subject: { name: "Agriculture" }, classLevel: { name: "SHS 1" } },
      },
    },
    select: { id: true },
  });
  assert(primaryCs, "fixture: primary Content Standard 1.2.2.CS.1 exists");
  if (primaryCs) {
    const primaryRes = await getJson(
      `/api/curriculum/learning-outcomes?contentStandardId=${primaryCs.id}`,
    );
    assert(primaryRes.status === 200, "GET /learning-outcomes for the PRIMARY content standard -> 200");
    const primaryOutcomes: Option[] = primaryRes.body.data;
    assert(
      primaryOutcomes.some((o) => o.label.includes("1.2.2.LO.1")),
      "the primary content standard still resolves to 1.2.2.LO.1",
    );
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error("Test script crashed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

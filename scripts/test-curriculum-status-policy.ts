import { PrismaClient } from "@prisma/client";
import {
  isVisibleToTeacher,
  isVisibleToAdmin,
  isEligibleForAiContext,
  type CurriculumEligibilityRecord,
} from "@/server/services/curriculum-eligibility.service";
import { getAiEligibleCurriculumContext } from "@/server/services/curriculum.service";
import { loginAsDemoTeacher } from "./_lib/authed-session";

/**
 * Verifies the curriculum eligibility policy (docs/curriculum-status-policy.md):
 * the pure isVisibleToTeacher/isEligibleForAiContext/isVisibleToAdmin
 * functions against every status combination that matters, the teacher-facing
 * API's REJECTED-exclusion end to end against a live tagged fixture chain,
 * and getAiEligibleCurriculumContext's fail-closed behaviour per chain level.
 *
 *   npx tsx scripts/test-curriculum-status-policy.ts
 */
const prisma = new PrismaClient();
const TAG = `TESTPOLICY-${Date.now()}`;

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

function record(
  extractionStatus: CurriculumEligibilityRecord["extractionStatus"],
  reviewStatus: CurriculumEligibilityRecord["reviewStatus"],
  sourcePage: number | null = 10,
): CurriculumEligibilityRecord {
  return { extractionStatus, reviewStatus, sourcePage };
}

function unitTests() {
  console.log("1) Pure policy functions — every status combination");

  const approved = record("EXTRACTED", "APPROVED");
  assert(isVisibleToTeacher(approved), "APPROVED: teacher visible");
  assert(isEligibleForAiContext(approved), "APPROVED: AI eligible");
  assert(isVisibleToAdmin(approved), "APPROVED: admin visible");

  const eligibleNeedsReview = record("NEEDS_REVIEW", "APPROVED");
  assert(isVisibleToTeacher(eligibleNeedsReview), "eligible NEEDS_REVIEW (human-approved override): teacher visible");
  assert(isEligibleForAiContext(eligibleNeedsReview), "eligible NEEDS_REVIEW (human-approved override): AI eligible");

  const unresolvedNeedsReview = record("NEEDS_REVIEW", "PENDING");
  assert(isVisibleToTeacher(unresolvedNeedsReview), "unresolved NEEDS_REVIEW: teacher visible (current-development-use policy)");
  assert(!isEligibleForAiContext(unresolvedNeedsReview), "unresolved NEEDS_REVIEW: AI ineligible (can't distinguish resolved-vs-ambiguous per record)");
  assert(isVisibleToAdmin(unresolvedNeedsReview), "unresolved NEEDS_REVIEW: admin visible and (structurally) flaggable via extractionStatus");

  const extracted = record("EXTRACTED", "PENDING");
  assert(isVisibleToTeacher(extracted), "EXTRACTED: teacher visible (clean extraction, not yet human-reviewed)");
  assert(isEligibleForAiContext(extracted), "EXTRACTED: AI eligible (clean extraction + provenance)");

  const extractedNoProvenance = record("EXTRACTED", "PENDING", null);
  assert(isVisibleToTeacher(extractedNoProvenance), "EXTRACTED without sourcePage: still teacher visible");
  assert(!isEligibleForAiContext(extractedNoProvenance), "EXTRACTED without sourcePage: AI ineligible (no provenance)");

  const rejectedExtraction = record("REJECTED", "PENDING");
  assert(!isVisibleToTeacher(rejectedExtraction), "REJECTED (extractionStatus): teacher hidden");
  assert(!isEligibleForAiContext(rejectedExtraction), "REJECTED (extractionStatus): AI ineligible");
  assert(isVisibleToAdmin(rejectedExtraction), "REJECTED (extractionStatus): admin visible");

  const rejectedReview = record("EXTRACTED", "REJECTED");
  assert(!isVisibleToTeacher(rejectedReview), "REJECTED (reviewStatus, a human rejected an otherwise-clean extraction): teacher hidden");
  assert(!isEligibleForAiContext(rejectedReview), "REJECTED (reviewStatus): AI ineligible");

  const legacyNull = record(null, "PENDING");
  assert(isVisibleToTeacher(legacyNull), "legacy null-extractionStatus (pre-Checkpoint-6 seed): teacher visible (preserve current behaviour)");
  assert(!isEligibleForAiContext(legacyNull), "legacy null-extractionStatus: AI ineligible (can't confirm it's a clean extraction)");
}

async function apiVisibilityTest() {
  console.log("2) Teacher-facing API excludes a REJECTED Strand end to end");

  const subject = await prisma.subject.create({ data: { name: `${TAG} Subject`, code: TAG } });
  const classLevel = await prisma.classLevel.create({ data: { name: `${TAG} Class`, sequence: 9001 } });
  const version = await prisma.curriculumVersion.create({ data: { name: `${TAG} Version` } });

  const visibleStrand = await prisma.strand.create({
    data: {
      subjectId: subject.id,
      classLevelId: classLevel.id,
      curriculumVersionId: version.id,
      name: `${TAG} Visible Strand`,
      sequence: 1,
      extractionStatus: "EXTRACTED",
      reviewStatus: "PENDING",
    },
  });
  const rejectedStrand = await prisma.strand.create({
    data: {
      subjectId: subject.id,
      classLevelId: classLevel.id,
      curriculumVersionId: version.id,
      name: `${TAG} Rejected Strand`,
      sequence: 2,
      extractionStatus: "REJECTED",
      reviewStatus: "PENDING",
    },
  });
  const reviewRejectedStrand = await prisma.strand.create({
    data: {
      subjectId: subject.id,
      classLevelId: classLevel.id,
      curriculumVersionId: version.id,
      name: `${TAG} Review-Rejected Strand`,
      sequence: 3,
      extractionStatus: "EXTRACTED",
      reviewStatus: "REJECTED",
    },
  });
  const needsReviewStrand = await prisma.strand.create({
    data: {
      subjectId: subject.id,
      classLevelId: classLevel.id,
      curriculumVersionId: version.id,
      name: `${TAG} Needs-Review Strand`,
      sequence: 4,
      extractionStatus: "NEEDS_REVIEW",
      reviewStatus: "PENDING",
    },
  });

  const session = await loginAsDemoTeacher();
  const res = await session.get(`/api/curriculum/strands?subjectId=${subject.id}&classLevelId=${classLevel.id}`);
  assert(res.status === 200, "GET /strands -> 200");
  const labels: string[] = (res.body.data ?? []).map((o: { label: string }) => o.label);

  assert(labels.includes(visibleStrand.name), "EXTRACTED strand IS visible through the live API");
  assert(labels.includes(needsReviewStrand.name), "NEEDS_REVIEW strand IS visible through the live API");
  assert(!labels.includes(rejectedStrand.name), "extractionStatus=REJECTED strand is EXCLUDED from the live API");
  assert(!labels.includes(reviewRejectedStrand.name), "reviewStatus=REJECTED strand is EXCLUDED from the live API");

  return { subject, classLevel, version, strands: [visibleStrand, rejectedStrand, reviewRejectedStrand, needsReviewStrand] };
}

async function aiContextBoundaryTest() {
  console.log("3) getAiEligibleCurriculumContext — fails closed per chain level, against a real fixture");

  const subject = await prisma.subject.create({ data: { name: `${TAG} AI Subject`, code: `${TAG}-AI` } });
  const classLevel = await prisma.classLevel.create({ data: { name: `${TAG} AI Class`, sequence: 9002 } });
  const version = await prisma.curriculumVersion.create({ data: { name: `${TAG} AI Version` } });
  const clean = { extractionStatus: "EXTRACTED" as const, reviewStatus: "PENDING" as const, sourcePage: 42 };

  const strand = await prisma.strand.create({
    data: { subjectId: subject.id, classLevelId: classLevel.id, curriculumVersionId: version.id, name: `${TAG} AI Strand`, sequence: 1, ...clean },
  });
  const subStrand = await prisma.subStrand.create({
    data: { strandId: strand.id, name: `${TAG} AI Sub-Strand`, sequence: 1, ...clean },
  });
  const contentStandard = await prisma.contentStandard.create({
    data: { subStrandId: subStrand.id, description: `${TAG} AI CS`, sequence: 1, ...clean },
  });
  const learningOutcome = await prisma.learningOutcome.create({
    data: { contentStandardId: contentStandard.id, description: `${TAG} AI LO`, sequence: 1, ...clean },
  });
  const learningIndicator = await prisma.learningIndicator.create({
    data: { learningOutcomeId: learningOutcome.id, description: `${TAG} AI LI`, sequence: 1, ...clean },
  });

  const eligible = await getAiEligibleCurriculumContext(learningIndicator.id);
  assert(eligible.eligible === true, "a fully clean chain (all EXTRACTED + sourcePage) is AI-eligible");
  if (eligible.eligible) {
    assert(eligible.context.learningIndicator.id === learningIndicator.id, "returned context resolves the requested indicator");
  }

  // Now flip just the Content Standard to REJECTED and confirm the whole chain fails closed.
  await prisma.contentStandard.update({ where: { id: contentStandard.id }, data: { extractionStatus: "REJECTED" } });
  const afterCsRejected = await getAiEligibleCurriculumContext(learningIndicator.id);
  assert(afterCsRejected.eligible === false, "a REJECTED Content Standard makes the whole chain AI-ineligible");
  if (!afterCsRejected.eligible) {
    assert(/Content Standard/.test(afterCsRejected.ineligibleReason), "ineligibleReason names the failing level (Content Standard)");
  }
  await prisma.contentStandard.update({ where: { id: contentStandard.id }, data: { extractionStatus: "EXTRACTED" } });

  // An ADDITIONAL linked Content Standard that's ineligible should be dropped from the
  // context, not fail the whole chain (it's supplementary, not load-bearing).
  const contentStandard2 = await prisma.contentStandard.create({
    data: { subStrandId: subStrand.id, description: `${TAG} AI CS 2 (additional, ineligible)`, sequence: 2, extractionStatus: "NEEDS_REVIEW", reviewStatus: "PENDING", sourcePage: 43 },
  });
  await prisma.learningOutcomeContentStandardLink.create({
    data: { learningOutcomeId: learningOutcome.id, contentStandardId: contentStandard2.id },
  });
  const withIneligibleAdditional = await getAiEligibleCurriculumContext(learningIndicator.id);
  assert(withIneligibleAdditional.eligible === true, "an ineligible ADDITIONAL Content Standard doesn't fail the whole chain");
  if (withIneligibleAdditional.eligible) {
    assert(
      !withIneligibleAdditional.context.contentStandard.additional.some((cs) => cs.id === contentStandard2.id),
      "the ineligible additional Content Standard is filtered out of the returned context",
    );
  }

  return { subject, classLevel, version };
}

async function cleanup(fixtures: {
  visibility: Awaited<ReturnType<typeof apiVisibilityTest>>;
  aiBoundary: Awaited<ReturnType<typeof aiContextBoundaryTest>>;
}) {
  await prisma.learningOutcomeContentStandardLink.deleteMany({ where: { contentStandard: { description: { startsWith: TAG } } } });
  await prisma.learningIndicator.deleteMany({ where: { description: { startsWith: TAG } } });
  await prisma.learningOutcome.deleteMany({ where: { description: { startsWith: TAG } } });
  await prisma.contentStandard.deleteMany({ where: { description: { startsWith: TAG } } });
  await prisma.subStrand.deleteMany({ where: { name: { startsWith: TAG } } });
  await prisma.strand.deleteMany({ where: { name: { startsWith: TAG } } });
  await prisma.curriculumVersion.deleteMany({ where: { id: { in: [fixtures.visibility.version.id, fixtures.aiBoundary.version.id] } } });
  await prisma.classLevel.deleteMany({ where: { id: { in: [fixtures.visibility.classLevel.id, fixtures.aiBoundary.classLevel.id] } } });
  await prisma.subject.deleteMany({ where: { id: { in: [fixtures.visibility.subject.id, fixtures.aiBoundary.subject.id] } } });
}

async function main() {
  unitTests();
  const visibility = await apiVisibilityTest();
  const aiBoundary = await aiContextBoundaryTest();
  await cleanup({ visibility, aiBoundary });

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

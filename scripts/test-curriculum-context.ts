import { PrismaClient } from "@prisma/client";
import {
  getLearningOutcomeReverseRelationships,
  getCurriculumContext,
} from "@/server/services/curriculum.service";
import { NotFoundError } from "@/server/errors/app-error";

/**
 * Checkpoint 7 items 5 and 17: verifies the reverse-relationship and
 * full-curriculum-context service functions directly (they're read-only
 * data plumbing for a future AI context builder, not yet exposed through
 * any teacher-facing route — see their own doc comments in
 * curriculum.service.ts / curriculum.repository.ts). Exercises both a
 * Learning Outcome with an ADDITIONAL Content Standard link and one
 * without, so the "additionalContentStandards: []" branch is covered too.
 *
 *   npx tsx scripts/test-curriculum-context.ts
 */
const prisma = new PrismaClient();

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

async function main() {
  console.log("1) Learning Outcome WITH an additional Content Standard link");
  const link = await prisma.learningOutcomeContentStandardLink.findFirst({
    select: { learningOutcomeId: true, contentStandardId: true },
  });
  assert(link, "at least one LearningOutcomeContentStandardLink row exists as a fixture");
  if (!link) throw new Error("Cannot continue without a hybrid fixture.");

  const withLink = await getLearningOutcomeReverseRelationships(link.learningOutcomeId);
  assert(withLink.id === link.learningOutcomeId, "resolved the requested Learning Outcome");
  assert(withLink.primaryContentStandard.id !== link.contentStandardId, "primary Content Standard is NOT the additional one (they're distinct)");
  assert(
    withLink.additionalContentStandards.some((cs) => cs.id === link.contentStandardId),
    "additionalContentStandards includes the linked Content Standard",
  );
  assert(withLink.learningIndicators.length > 0, "Learning Indicators are resolved for this outcome");

  console.log("2) Learning Outcome WITHOUT an additional Content Standard link");
  const plainOutcome = await prisma.learningOutcome.findFirst({
    where: { additionalContentStandardLinks: { none: {} } },
    select: { id: true },
  });
  assert(plainOutcome, "fixture: a Learning Outcome with no additional links exists");
  if (plainOutcome) {
    const withoutLink = await getLearningOutcomeReverseRelationships(plainOutcome.id);
    assert(withoutLink.additionalContentStandards.length === 0, "additionalContentStandards is an empty array, not omitted/null");
    assert(withoutLink.primaryContentStandard.id, "primary Content Standard is still resolved");
  }

  console.log("3) Reverse relationships for an unknown Learning Outcome id -> NotFoundError");
  await getLearningOutcomeReverseRelationships("does-not-exist")
    .then(() => assert(false, "should have thrown"))
    .catch((e) => assert(e instanceof NotFoundError, "throws NotFoundError for an unknown id"));

  console.log("4) Full curriculum context for a Learning Indicator under the hybrid Learning Outcome");
  const indicator = await prisma.learningIndicator.findFirst({
    where: { learningOutcomeId: link.learningOutcomeId },
    select: { id: true },
  });
  assert(indicator, "fixture: the hybrid Learning Outcome has at least one Learning Indicator");
  if (indicator) {
    const context = await getCurriculumContext(indicator.id);
    assert(context.learningIndicator.id === indicator.id, "context resolves the requested Learning Indicator");
    assert(context.learningOutcome.id === link.learningOutcomeId, "context's Learning Outcome matches");
    assert(
      context.contentStandard.additional.some((cs) => cs.id === link.contentStandardId),
      "context.contentStandard.additional includes the linked Content Standard",
    );
    assert(context.contentStandard.primary.id !== link.contentStandardId, "context.contentStandard.primary is distinct from the additional one");
    assert(context.subject.id, "context includes subject");
    assert(context.classLevel.id, "context includes classLevel");
    assert(context.strand.id, "context includes strand");
    assert(context.subStrand.id, "context includes subStrand");
    assert(context.curriculumVersion.id, "context includes curriculumVersion (source/version metadata)");
  }

  console.log("5) Full curriculum context for an unknown Learning Indicator id -> NotFoundError");
  await getCurriculumContext("does-not-exist")
    .then(() => assert(false, "should have thrown"))
    .catch((e) => assert(e instanceof NotFoundError, "throws NotFoundError for an unknown id"));

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

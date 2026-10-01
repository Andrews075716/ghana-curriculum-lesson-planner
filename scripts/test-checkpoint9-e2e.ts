// Selects the deterministic MockAIProvider for the sections that exercise
// ai.service.ts's real pipeline — zero live Anthropic calls in this file.
process.env.AI_PROVIDER = "mock";

import { PrismaClient } from "@prisma/client";
import {
  EssentialQuestionsSuggestionSchema,
  LessonActivitiesSuggestionSchema,
  AssessmentsSuggestionSchema,
} from "@/lib/validation/ai.schema";
import * as aiService from "@/server/services/ai.service";
import { getAiEligibleCurriculumContext } from "@/server/services/curriculum.service";
import { getAIProvider } from "@/server/ai/ai-provider.factory";
import { NoopAIProvider } from "@/server/ai/providers/noop-ai-provider";
import { createDraftPlanner, updatePlannerDraft } from "@/server/repositories/planner.repository";
import { getPlannerDraftForTeacher } from "@/server/services/planner.service";
import { loginAsDemoTeacher } from "./_lib/authed-session";

/**
 * Checkpoint 9 end-to-end validation — the scenarios not already covered by
 * an existing test script: AI eligibility for a human-approved NEEDS_REVIEW
 * record, the AI-ineligible-but-teacher-visible UX, malformed provider
 * output rejection, the mock-provider production guard, and a full
 * save/reopen/edit round trip mixing teacher-written and AI-mock-generated
 * content with real curriculum ids verified (not just labels).
 *
 * Zero real Anthropic API calls.
 *
 *   npx tsx scripts/test-checkpoint9-e2e.ts
 */
const prisma = new PrismaClient();
const TAG = `CP9-${Date.now()}`;

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

async function section1_aiEligibilityNeedsReviewApproved() {
  console.log("1) AI eligibility: NEEDS_REVIEW + reviewStatus=APPROVED is eligible (human-override case)");

  const subject = await prisma.subject.create({ data: { name: `${TAG} Subject`, code: `${TAG}` } });
  const classLevel = await prisma.classLevel.create({ data: { name: `${TAG} Class`, sequence: 9101 } });
  const version = await prisma.curriculumVersion.create({ data: { name: `${TAG} Version` } });
  const clean = { extractionStatus: "EXTRACTED" as const, reviewStatus: "PENDING" as const, sourcePage: 10 };

  const strand = await prisma.strand.create({
    data: { subjectId: subject.id, classLevelId: classLevel.id, curriculumVersionId: version.id, name: `${TAG} Strand`, sequence: 1, ...clean },
  });
  const subStrand = await prisma.subStrand.create({
    data: { strandId: strand.id, name: `${TAG} Sub-Strand`, sequence: 1, ...clean },
  });
  const contentStandard = await prisma.contentStandard.create({
    data: { subStrandId: subStrand.id, description: `${TAG} CS`, sequence: 1, ...clean },
  });
  // The Learning Outcome itself is NEEDS_REVIEW, but a human has approved it.
  const learningOutcome = await prisma.learningOutcome.create({
    data: {
      contentStandardId: contentStandard.id,
      description: `${TAG} LO (needs-review, human-approved)`,
      sequence: 1,
      extractionStatus: "NEEDS_REVIEW",
      reviewStatus: "APPROVED",
      sourcePage: 11,
    },
  });
  const learningIndicator = await prisma.learningIndicator.create({
    data: { learningOutcomeId: learningOutcome.id, description: `${TAG} LI`, sequence: 1, ...clean },
  });

  const result = await getAiEligibleCurriculumContext(learningIndicator.id);
  assert(result.eligible === true, "NEEDS_REVIEW + APPROVED Learning Outcome is AI-eligible via the human-override rule");

  await prisma.learningIndicator.deleteMany({ where: { id: learningIndicator.id } });
  await prisma.learningOutcome.deleteMany({ where: { id: learningOutcome.id } });
  await prisma.contentStandard.deleteMany({ where: { id: contentStandard.id } });
  await prisma.subStrand.deleteMany({ where: { id: subStrand.id } });
  await prisma.strand.deleteMany({ where: { id: strand.id } });
  await prisma.curriculumVersion.deleteMany({ where: { id: version.id } });
  await prisma.classLevel.deleteMany({ where: { id: classLevel.id } });
  await prisma.subject.deleteMany({ where: { id: subject.id } });
}

async function section2_aiIneligibleButTeacherVisibleUX() {
  console.log(
    "2) AI-ineligible curriculum UX: teacher CAN see/select it; AI generation is refused only for a " +
      "genuine blocking reason (REJECTED or missing provenance), never merely for NEEDS_REVIEW/PENDING",
  );

  const subject = await prisma.subject.create({ data: { name: `${TAG} UX Subject`, code: `${TAG}-UX` } });
  const classLevel = await prisma.classLevel.create({ data: { name: `${TAG} UX Class`, sequence: 9102 } });
  const version = await prisma.curriculumVersion.create({ data: { name: `${TAG} UX Version` } });
  // Unresolved NEEDS_REVIEW, but structurally valid and provenance-complete: teacher-visible
  // AND AI-eligible under the current policy (see docs/curriculum-status-policy.md).
  const needsReview = { extractionStatus: "NEEDS_REVIEW" as const, reviewStatus: "PENDING" as const, sourcePage: 20 };

  const strand = await prisma.strand.create({
    data: { subjectId: subject.id, classLevelId: classLevel.id, curriculumVersionId: version.id, name: `${TAG} UX Strand`, sequence: 1, extractionStatus: "EXTRACTED", reviewStatus: "PENDING" },
  });
  const subStrand = await prisma.subStrand.create({
    data: { strandId: strand.id, name: `${TAG} UX Sub-Strand`, sequence: 1, extractionStatus: "EXTRACTED", reviewStatus: "PENDING", sourcePage: 19 },
  });
  const contentStandard = await prisma.contentStandard.create({
    data: { subStrandId: subStrand.id, description: `${TAG} UX CS`, sequence: 1, ...needsReview },
  });
  const learningOutcome = await prisma.learningOutcome.create({
    data: { contentStandardId: contentStandard.id, description: `${TAG} UX LO`, sequence: 1, extractionStatus: "EXTRACTED", reviewStatus: "PENDING", sourcePage: 21 },
  });
  const learningIndicator = await prisma.learningIndicator.create({
    data: { learningOutcomeId: learningOutcome.id, description: `${TAG} UX LI`, sequence: 1, extractionStatus: "EXTRACTED", reviewStatus: "PENDING", sourcePage: 22 },
  });

  const session = await loginAsDemoTeacher();

  // Teacher-visible: the content standard shows up through the real API.
  const csRes = await session.get(`/api/curriculum/content-standards?subStrandId=${subStrand.id}`);
  const csLabels: string[] = (csRes.body.data ?? []).map((o: { label: string }) => o.label);
  assert(csLabels.some((l) => l.includes(`${TAG} UX CS`)), "the NEEDS_REVIEW content standard IS visible/selectable to the teacher");

  // AI generation now SUCCEEDS (reaches the mock provider) for this NEEDS_REVIEW/PENDING,
  // structurally-valid, provenance-complete selection — the product change under test.
  const teacher = await prisma.teacherProfile.findFirstOrThrow({ where: { user: { email: "demo.teacher@example.edu.gh" } } });
  const plannerId = await createDraftPlanner(teacher.id, "2025/2026");
  await updatePlannerDraft(plannerId, teacher.id, { learningIndicatorId: learningIndicator.id, durationMinutes: 40 });

  const eqResult = await aiService.generateEssentialQuestions(plannerId, teacher.id);
  assert(
    eqResult.suggestion.essentialQuestions.length > 0,
    "AI generation SUCCEEDS for a NEEDS_REVIEW/PENDING, structurally valid, provenance-complete selection",
  );

  // Now make that same Content Standard genuinely ineligible (REJECTED) and confirm AI
  // generation is still correctly refused for an actual blocking reason, not substituted.
  await prisma.contentStandard.update({ where: { id: contentStandard.id }, data: { extractionStatus: "REJECTED" } });
  try {
    await aiService.generateEssentialQuestions(plannerId, teacher.id);
    assert(false, "should have refused AI generation for a REJECTED Content Standard");
  } catch (error) {
    const code = (error as { code?: string }).code;
    assert(code === "AI_CURRICULUM_INELIGIBLE", `REJECTED Content Standard -> AI_CURRICULUM_INELIGIBLE (got code=${code})`);
    assert(
      !JSON.stringify((error as Error).message).includes(learningIndicator.id),
      "the refusal message does not leak the internal database id",
    );
  }

  await prisma.lessonPlanner.deleteMany({ where: { id: plannerId } });
  await prisma.learningIndicator.deleteMany({ where: { id: learningIndicator.id } });
  await prisma.learningOutcome.deleteMany({ where: { id: learningOutcome.id } });
  await prisma.contentStandard.deleteMany({ where: { id: contentStandard.id } });
  await prisma.subStrand.deleteMany({ where: { id: subStrand.id } });
  await prisma.strand.deleteMany({ where: { id: strand.id } });
  await prisma.curriculumVersion.deleteMany({ where: { id: version.id } });
  await prisma.classLevel.deleteMany({ where: { id: classLevel.id } });
  await prisma.subject.deleteMany({ where: { id: subject.id } });
}

async function section3_mockProviderProductionGuard() {
  console.log("3) Mock provider production guard: AI_PROVIDER=mock + NODE_ENV=production -> falls back to Noop, never serves fake content");

  const originalNodeEnv = process.env.NODE_ENV;
  process.env.AI_PROVIDER = "mock";
  // @ts-expect-error -- NODE_ENV is typed readonly by @types/node; a test needs to flip it.
  process.env.NODE_ENV = "production";
  try {
    const provider = await getAIProvider();
    assert(provider instanceof NoopAIProvider, "getAIProvider() refuses 'mock' under NODE_ENV=production and falls back to NoopAIProvider");
    assert(provider.isEnabled() === false, "the fallback Noop provider correctly reports itself disabled");
  } finally {
    // @ts-expect-error -- restoring the original value.
    process.env.NODE_ENV = originalNodeEnv;
    process.env.AI_PROVIDER = "mock"; // restore for the rest of this file
  }

  const providerOutsideProd = await getAIProvider();
  assert(providerOutsideProd.name === "mock", "outside production, AI_PROVIDER=mock correctly selects MockAIProvider");
}

async function section4_malformedProviderOutputRejected() {
  console.log("4) Malformed AI provider output is rejected by schema validation before it can reach the wizard");

  // Invalid JSON/structure: not an object at all.
  assert(!EssentialQuestionsSuggestionSchema.safeParse("not an object").success, "a bare string instead of an object is rejected");
  assert(!EssentialQuestionsSuggestionSchema.safeParse(null).success, "null is rejected");

  // Missing required field.
  const missingField = LessonActivitiesSuggestionSchema.safeParse({
    lessonActivities: [{ stage: "ACTIVITY", label: "x", sequence: 1, durationMinutes: 10, teacherActivity: "a" /* learnerActivity missing */ }],
  });
  assert(!missingField.success, "a lesson activity missing the required learnerActivity field is rejected");

  // Wrong data type (non-duration field this time — stage as a number, not the enum).
  const wrongType = LessonActivitiesSuggestionSchema.safeParse({
    lessonActivities: [{ stage: 123, label: "x", sequence: 1, durationMinutes: 10, teacherActivity: "a", learnerActivity: "b" }],
  });
  assert(!wrongType.success, "a non-enum type for 'stage' is rejected");

  // Wrong/invalid enum value.
  const badEnum = AssessmentsSuggestionSchema.safeParse({
    assessments: [{ dokLevel: "LEVEL_99", description: "x", sequence: 1 }],
  });
  assert(!badEnum.success, "an invalid DoK enum value ('LEVEL_99') is rejected");

  // Empty required collection where the schema specifically requires at
  // least one item (FullLessonDraftSuggestionSchema's CLOSURE-row refine,
  // already exercised in test-ai-architecture.ts §8) — vs. a genuinely
  // OPTIONAL empty collection, which must NOT be rejected (an AI legitimately
  // having nothing to suggest is valid, not malformed).
  assert(
    EssentialQuestionsSuggestionSchema.safeParse({ essentialQuestions: [] }).success,
    "an empty essentialQuestions array is valid (the AI having nothing to suggest is not malformed output)",
  );

  // Unexpected duration representation: a float where an integer is required.
  const floatDuration = LessonActivitiesSuggestionSchema.safeParse({
    lessonActivities: [{ stage: "ACTIVITY", label: "x", sequence: 1, durationMinutes: 10.5, teacherActivity: "a", learnerActivity: "b" }],
  });
  assert(!floatDuration.success, "a non-integer duration (10.5) is rejected");
}

async function section5_fullRoundTripWithAiAcceptedContent() {
  console.log("5) Full save/reopen/edit round trip: teacher content + AI-mock-generated content + DoK assessment");

  const teacher = await prisma.teacherProfile.findFirstOrThrow({ where: { user: { email: "demo.teacher@example.edu.gh" } } });
  const indicator = await prisma.learningIndicator.findFirstOrThrow({
    where: { code: "1.1.1.LI.1", learningOutcome: { contentStandard: { subStrand: { strand: { subject: { name: "Mathematics" } } } } } },
  });
  const chemistryIndicator = await prisma.learningIndicator.findFirstOrThrow({
    where: { learningOutcome: { contentStandard: { subStrand: { strand: { subject: { name: "Chemistry" } } } } } },
  });

  const plannerId = await createDraftPlanner(teacher.id, "2025/2026");

  // Save Step 1 + curriculum alignment (Mathematics fixture) + teacher-written content.
  await updatePlannerDraft(plannerId, teacher.id, {
    classSection: "Form 1 Gold",
    term: "TERM_1",
    weekNumber: 4,
    lessonNumber: 2,
    durationMinutes: 50,
    learningIndicatorId: indicator.id,
    essentialQuestions: ["Teacher-written question: why does closure matter?"],
    keywords: ["closure", "real numbers"],
  });

  // Simulate the client accepting an AI suggestion (via the mock provider,
  // going through the real ai.service.ts pipeline) and PATCHing it in —
  // exactly what AIAssistPanel's onReplace does after teacher Insert.
  const { suggestion: aiEQ } = await aiService.generateEssentialQuestions(plannerId, teacher.id);
  await updatePlannerDraft(plannerId, teacher.id, {
    essentialQuestions: aiEQ.essentialQuestions, // teacher clicked "Replace"
    assessments: [{ dokLevel: "LEVEL_3", description: "AI-suggested DoK 3 assessment", sequence: 1 }],
  });

  // --- Reopen: verify restoration by ID, not just label -------------------
  const reopened = await getPlannerDraftForTeacher(plannerId, teacher.id);
  assert(reopened.learningIndicatorId === indicator.id, "reopened draft's learningIndicatorId matches exactly (verified by id, not label)");
  assert(reopened.classSection === "Form 1 Gold", "classSection persisted");
  assert(reopened.durationMinutes === 50, "durationMinutes persisted");
  assert(
    JSON.stringify(reopened.essentialQuestions) === JSON.stringify(aiEQ.essentialQuestions),
    "the AI-generated (then teacher-accepted) essential questions persisted correctly, replacing the original teacher-written one",
  );
  const reopenedAssessments = reopened.lesson?.assessments ?? [];
  assert(reopenedAssessments.length === 1 && reopenedAssessments[0].dokLevel === "LEVEL_3", "DoK assessment persisted with the correct level");

  // Official curriculum itself must remain byte-for-byte unchanged by any of this.
  const indicatorAfter = await prisma.learningIndicator.findUniqueOrThrow({ where: { id: indicator.id } });
  assert(indicatorAfter.description.startsWith("Develop the real number system"), "the official Learning Indicator's own wording is untouched by planner save/AI activity");

  // --- Edit: change the curriculum selection (Mathematics -> Chemistry) ---
  await updatePlannerDraft(plannerId, teacher.id, { learningIndicatorId: chemistryIndicator.id });
  const afterEdit = await getPlannerDraftForTeacher(plannerId, teacher.id);
  assert(afterEdit.learningIndicatorId === chemistryIndicator.id, "edited planner now references the new Learning Indicator");
  assert(
    JSON.stringify(afterEdit.essentialQuestions) === JSON.stringify(aiEQ.essentialQuestions),
    "changing the curriculum selection does not wipe already-saved planning content (that's the wizard UI's downstream-reset responsibility for curriculum FIELDS specifically, not a server-side side effect)",
  );

  // --- Reopen again after the edit -----------------------------------------
  const reopenedAgain = await getPlannerDraftForTeacher(plannerId, teacher.id);
  assert(reopenedAgain.learningIndicatorId === chemistryIndicator.id, "the edited curriculum selection survives a second reopen");

  await prisma.lessonPlanner.deleteMany({ where: { id: plannerId } });
}

async function main() {
  await section1_aiEligibilityNeedsReviewApproved();
  await section2_aiIneligibleButTeacherVisibleUX();
  await section3_mockProviderProductionGuard();
  await section4_malformedProviderOutputRejected();
  await section5_fullRoundTripWithAiAcceptedContent();

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

import { PrismaClient } from "@prisma/client";
import { loginAsDemoTeacher } from "./_lib/authed-session";

/**
 * End-to-end test of the Create Planner wizard's backend: creates a draft,
 * autosaves each step's data via PATCH, verifies it round-trips via GET,
 * publishes, and verifies the strict publish validation actually rejects
 * an incomplete draft. Run against a live dev server + database:
 *
 *   npx tsx scripts/test-planner-wizard-api.ts
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

async function main() {
  const session = await loginAsDemoTeacher();
  const postJson = session.post.bind(session);
  const patchJson = session.patch.bind(session);
  const getJson = session.get.bind(session);

  console.log("1) Create a draft");
  const created = await postJson("/api/planners");
  assert(created.status === 201, "POST /api/planners -> 201");
  const plannerId: string = created.body.data.id;
  assert(typeof plannerId === "string" && plannerId.length > 0, "returns a planner id");

  console.log("2) Fetch the fresh draft — everything should be empty/null");
  const freshDraft = await getJson(`/api/planners/${plannerId}`);
  assert(freshDraft.status === 200, "GET fresh draft -> 200");
  assert(freshDraft.body.data.status === "DRAFT", "fresh draft status is DRAFT");
  assert(freshDraft.body.data.learningIndicatorId === null, "fresh draft has no indicator yet");
  assert(freshDraft.body.data.lesson.sequence === 1, "fresh draft has Lesson 1 auto-created");

  console.log("3) Resolve a real learning indicator to attach (from seeded curriculum)");
  const indicatorRow = await prisma.learningIndicator.findFirstOrThrow({
    where: { code: "COMP-F1-STR-01-SS-01-CS-01-LI-01" },
  });

  console.log("4) PATCH Step 1 + Step 2 data");
  const step1and2 = await patchJson(`/api/planners/${plannerId}`, {
    classSection: "Form 1",
    term: "TERM_1",
    weekNumber: 3,
    lessonNumber: 2,
    lessonDate: "2026-09-10",
    durationMinutes: 80,
    learningIndicatorId: indicatorRow.id,
  });
  assert(step1and2.status === 200, "PATCH step 1+2 -> 200");

  console.log("5) PATCH Step 3 + 4 list fields");
  const themesRes = await getJson("/api/cross-cutting-themes");
  assert(themesRes.body.data.length === 4, "exactly 4 cross-cutting themes are seeded");
  assert(
    themesRes.body.data.every((t: { label?: string }) => typeof t.label === "string" && t.label.length > 0),
    "every theme has a non-empty label",
  );
  const themeId = themesRes.body.data[0].id as string;
  const secondThemeId = themesRes.body.data[1].id as string;
  const step3and4 = await patchJson(`/api/planners/${plannerId}`, {
    essentialQuestions: ["How do computers store numbers?", "Why binary?"],
    crossCuttingThemes: [
      { themeId, explanation: "Learners collaborate in mixed-ability pairs." },
      { themeId: secondThemeId, explanation: "" },
    ],
    pedagogicalStrategies: ["Think-Pair-Share"],
    teachingLearningResources: ["Laptop computers"],
    keywords: ["bit pattern", "nibble"],
    differentiation: {
      mixedAbilityGrouping: "Group learners by proficiency after the starter activity",
      scaffoldSupport: "Provide worked examples for struggling learners",
      extensionChallenge: "Ask advanced learners to convert larger binary numbers",
      resourceAdaptation: "Enlarged print materials for low-vision learners",
      learningTaskDifferentiation: "Vary the number of practice items by group",
      teacherPeerSupport: "Pair learners for peer tutoring",
      additionalNotes: "",
    },
    learningTasks: ["Activity ball game"],
    pedagogicalExemplars: ["Flash card games"],
  });
  assert(step3and4.status === 200, "PATCH step 3+4 -> 200");

  console.log("6) PATCH Step 5 + 6 (activities incl. assessment/closure stages, assessments)");
  const step5and6 = await patchJson(`/api/planners/${plannerId}`, {
    lessonActivities: [
      {
        stage: "STARTER",
        label: "Starter",
        sequence: 1,
        durationMinutes: 10,
        teacherActivity: "Discuss myths about computing",
        learnerActivity: "Share thoughts",
      },
      {
        stage: "ACTIVITY",
        label: "Activity 1",
        sequence: 2,
        durationMinutes: 25,
        teacherActivity: "Demonstrate nibble mapping",
        learnerActivity: "Practice grouping bits",
      },
      {
        stage: "CLOSURE",
        label: "Lesson Closure",
        sequence: 3,
        durationMinutes: 15,
        teacherActivity: "Guide learners to present responses",
        learnerActivity: "Present responses",
      },
    ],
    assessments: [
      { dokLevel: "LEVEL_1", description: "Convert decimal to binary", sequence: 1 },
    ],
  });
  assert(step5and6.status === 200, "PATCH step 5+6 -> 200");

  console.log("7) Fetch the full draft back and verify everything round-tripped");
  const fullDraft = await getJson(`/api/planners/${plannerId}`);
  const d = fullDraft.body.data;
  assert(fullDraft.status === 200, "GET full draft -> 200");
  assert(d.classSection === "Form 1", "classSection round-trips");
  assert(d.term === "TERM_1", "term round-trips");
  assert(d.weekNumber === 3, "weekNumber round-trips");
  assert(d.durationMinutes === 80, "durationMinutes round-trips");
  assert(d.learningIndicatorId === indicatorRow.id, "learningIndicatorId round-trips");
  assert(
    JSON.stringify(d.essentialQuestions) ===
      JSON.stringify(["How do computers store numbers?", "Why binary?"]),
    "essentialQuestions round-trip in order",
  );
  assert(d.crossCuttingThemes.length === 2, "both cross-cutting theme selections round-trip");
  const firstTheme = d.crossCuttingThemes.find((t: { themeId: string }) => t.themeId === themeId);
  assert(
    firstTheme?.explanation === "Learners collaborate in mixed-ability pairs.",
    "cross-cutting theme explanation round-trips",
  );
  const secondTheme = d.crossCuttingThemes.find(
    (t: { themeId: string }) => t.themeId === secondThemeId,
  );
  assert(secondTheme?.explanation === "", "a theme selected with no explanation yet round-trips as empty string");
  assert(
    d.differentiation.mixedAbilityGrouping ===
      "Group learners by proficiency after the starter activity",
    "differentiation.mixedAbilityGrouping round-trips",
  );
  assert(
    d.differentiation.scaffoldSupport === "Provide worked examples for struggling learners",
    "differentiation.scaffoldSupport round-trips",
  );
  assert(d.differentiation.additionalNotes === "", "an empty differentiation field round-trips as empty string");
  assert(d.lesson.sequence === 2, "lesson number (sequence) round-trips");
  assert(d.lesson.date === "2026-09-10", "lesson date round-trips");
  assert(d.lesson.lessonActivities.length === 3, "all lesson activities round-trip");
  assert(d.lesson.lessonActivities[0].stage === "STARTER", "activity stage round-trips");
  assert(d.lesson.assessments.length === 1, "assessment round-trips");
  const closureRow = d.lesson.lessonActivities.find((a: { stage: string }) => a.stage === "CLOSURE");
  assert(closureRow !== undefined, "closure activity round-trips as a CLOSURE-stage row");
  assert(closureRow.durationMinutes === 15, "closure duration round-trips");

  console.log("8) Re-PATCH a list field with fewer items — replace-all must not leave stale rows");
  await patchJson(`/api/planners/${plannerId}`, { keywords: ["bit pattern"] });
  const afterReplace = await getJson(`/api/planners/${plannerId}`);
  assert(
    JSON.stringify(afterReplace.body.data.keywords) === JSON.stringify(["bit pattern"]),
    "keywords list was fully replaced, not appended",
  );

  console.log("8b) Re-PATCH cross-cutting themes with one fewer selection — replace-all, no stale rows");
  await patchJson(`/api/planners/${plannerId}`, {
    crossCuttingThemes: [{ themeId, explanation: "Updated explanation." }],
  });
  const afterThemeReplace = await getJson(`/api/planners/${plannerId}`);
  assert(
    afterThemeReplace.body.data.crossCuttingThemes.length === 1,
    "second theme selection was removed, not left stale",
  );
  assert(
    afterThemeReplace.body.data.crossCuttingThemes[0].explanation === "Updated explanation.",
    "re-PATCHed explanation overwrites the old one",
  );

  console.log("8c) Re-PATCH differentiation — a 1:1 upsert, not an append");
  await patchJson(`/api/planners/${plannerId}`, {
    differentiation: {
      mixedAbilityGrouping: "Revised grouping approach",
      scaffoldSupport: "",
      extensionChallenge: "",
      resourceAdaptation: "",
      learningTaskDifferentiation: "",
      teacherPeerSupport: "",
      additionalNotes: "",
    },
  });
  const afterDiffReplace = await getJson(`/api/planners/${plannerId}`);
  assert(
    afterDiffReplace.body.data.differentiation.mixedAbilityGrouping === "Revised grouping approach",
    "differentiation upsert overwrites the previous value",
  );
  assert(
    afterDiffReplace.body.data.differentiation.scaffoldSupport === "",
    "differentiation upsert clears fields not re-supplied to empty (whole-object replace)",
  );

  console.log("9) Publish the (now-complete) draft");
  const publishRes = await postJson(`/api/planners/${plannerId}/publish`);
  assert(publishRes.status === 200, "POST publish -> 200 for a complete draft");
  const publishedDraft = await getJson(`/api/planners/${plannerId}`);
  assert(publishedDraft.body.data.status === "PUBLISHED", "status is PUBLISHED after publish");

  console.log("10) Editing a published planner should be rejected");
  const editAfterPublish = await patchJson(`/api/planners/${plannerId}`, { weekNumber: 9 });
  assert(editAfterPublish.status === 400, "PATCH after publish -> 400 (locked)");

  console.log("11) Publishing an incomplete draft should be rejected with details");
  const incomplete = await postJson("/api/planners");
  const incompleteId: string = incomplete.body.data.id;
  const incompletePublish = await postJson(`/api/planners/${incompleteId}/publish`);
  assert(incompletePublish.status === 400, "publish incomplete draft -> 400");
  assert(
    typeof incompletePublish.body.error?.message === "string" &&
      incompletePublish.body.error.message.includes("learningIndicatorId"),
    "error message names what's missing",
  );

  console.log("12) A teacher cannot fetch another teacher's draft id pattern (not-found for bogus id)");
  const bogus = await getJson("/api/planners/does-not-exist");
  assert(bogus.status === 404, "GET unknown planner id -> 404");

  console.log(`\n${passed} passed, ${failed} failed`);

  // Cleanup: remove the two test planners so they don't pollute the dashboard.
  await prisma.lessonPlanner.delete({ where: { id: plannerId } });
  await prisma.lessonPlanner.delete({ where: { id: incompleteId } });

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

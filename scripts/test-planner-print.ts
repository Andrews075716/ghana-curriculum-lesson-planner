import { PrismaClient } from "@prisma/client";
import { loginAsDemoTeacher } from "./_lib/authed-session";

/**
 * Verifies the printable planner preview page (`/planners/[id]/print`)
 * actually renders the required sections with real data, by creating a
 * fully-populated planner via the same API the wizard uses, publishing it,
 * then fetching the print page's HTML and checking for key content.
 *
 *   npx tsx scripts/test-planner-print.ts
 */
const BASE_URL = "http://localhost:3000";
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

  console.log("1) Create and fully populate a draft");
  const created = await postJson("/api/planners");
  const plannerId: string = created.body.data.id;

  const indicatorRow = await prisma.learningIndicator.findFirstOrThrow({
    where: { code: "COMP-F1-STR-01-SS-01-CS-01-LI-01" },
  });

  await patchJson(`/api/planners/${plannerId}`, {
    classSection: "Form 1 Gold",
    term: "TERM_1",
    weekNumber: 4,
    lessonNumber: 1,
    lessonDate: "2026-09-14",
    durationMinutes: 60,
    learningIndicatorId: indicatorRow.id,
  });

  const themesRes = await getJson("/api/cross-cutting-themes");
  const themeId = themesRes.body.data[0].id as string;
  const themeLabel = themesRes.body.data[0].label as string;

  await patchJson(`/api/planners/${plannerId}`, {
    essentialQuestions: ["Why do computers use binary?"],
    crossCuttingThemes: [{ themeId, explanation: "Learners work in mixed-gender pairs." }],
    pedagogicalStrategies: ["Think-Pair-Share"],
    teachingLearningResources: ["Laptop computers", "Projector"],
    keywords: ["bit", "byte", "nibble"],
    differentiation: {
      mixedAbilityGrouping: "Group by proficiency after the starter",
      scaffoldSupport: "Provide worked examples",
      extensionChallenge: "Convert larger binary numbers",
      resourceAdaptation: "Enlarged handouts for low-vision learners",
      learningTaskDifferentiation: "Vary item count by group",
      teacherPeerSupport: "Peer tutoring pairs",
      additionalNotes: "Check in with Group C first",
    },
    learningTasks: ["Activity ball game"],
    pedagogicalExemplars: ["Flash card games"],
  });

  await patchJson(`/api/planners/${plannerId}`, {
    lessonActivities: [
      {
        stage: "STARTER",
        label: "Starter",
        sequence: 1,
        durationMinutes: 5,
        teacherActivity: "Ask learners what they know about binary",
        learnerActivity: "Share prior knowledge",
      },
      {
        stage: "ACTIVITY",
        label: "Activity 1",
        sequence: 2,
        durationMinutes: 30,
        teacherActivity: "Demonstrate decimal-to-binary conversion",
        learnerActivity: "Practice conversions in pairs",
      },
      {
        stage: "CLOSURE",
        label: "Lesson Closure",
        sequence: 3,
        durationMinutes: 10,
        teacherActivity: "Summarize key points and preview next lesson",
        learnerActivity: "Ask final questions",
      },
    ],
    assessments: [
      { dokLevel: "LEVEL_2", description: "Convert 13 to binary on the whiteboard", sequence: 1 },
    ],
  });

  console.log("2) Publish it");
  const publishRes = await postJson(`/api/planners/${plannerId}/publish`);
  assert(publishRes.status === 200, "publish -> 200");

  console.log("3) Fetch the print page HTML");
  const printRes = await fetch(`${BASE_URL}/planners/${plannerId}/print`, {
    headers: { Cookie: session.toFetchCookieHeader() },
  });
  assert(printRes.status === 200, "GET print page -> 200");
  const html = await printRes.text();

  assert(html.includes("Lesson Plan"), "page renders the 'Lesson Plan' title");
  assert(html.includes("Achimota Basic School"), "renders the seeded school name");
  assert(html.includes("Ama Mensah"), "renders the seeded teacher name");
  assert(html.includes("Form 1 Gold"), "renders the classSection as Form");
  assert(html.includes("Computing"), "renders the subject name");
  assert(html.includes("Term 1"), "renders the term label, not the raw enum");
  assert(html.includes("Curriculum Alignment"), "renders the Curriculum Alignment section");
  assert(html.includes("Strand"), "renders a Strand label");
  assert(html.includes("Learning Outcome(s)"), "renders 'Learning Outcome(s)' label");
  assert(html.includes("Learning Indicator(s)"), "renders 'Learning Indicator(s)' label");
  assert(html.includes("Why do computers use binary?"), "renders the essential question");
  assert(html.includes(themeLabel), "renders the selected cross-cutting theme label");
  assert(html.includes("Learners work in mixed-gender pairs."), "renders the theme explanation");
  assert(html.includes("Mixed-Ability Grouping"), "renders a differentiation field label");
  assert(html.includes("Group by proficiency after the starter"), "renders a differentiation value");
  assert(html.includes("Learning Tasks"), "renders the Learning Tasks section");
  assert(html.includes("Pedagogical Exemplars"), "renders the Pedagogical Exemplars section");
  assert(html.includes("bit, byte, nibble"), "renders keywords joined inline");
  assert(html.includes("Main Lesson"), "renders the Main Lesson section");
  assert(html.includes("Demonstrate decimal-to-binary conversion"), "renders a teacher activity in the table");
  assert(html.includes("Practice conversions in pairs"), "renders a learner activity in the table");
  // Next.js App Router inlines a second copy of the page's text as a
  // serialized RSC flight payload later in the raw HTML (for hydration),
  // so a plain substring count double-counts everything. Compare only the
  // first (visible-DOM) occurrence's section: the slice between the "Main
  // Lesson" and "Assessment" headings in the initial render.
  const firstMainLessonIndex = html.indexOf("Main Lesson");
  const firstAssessmentIndex = html.indexOf("Assessment", firstMainLessonIndex);
  const mainLessonSectionHtml = html.slice(firstMainLessonIndex, firstAssessmentIndex);
  assert(
    !mainLessonSectionHtml.includes("Summarize key points and preview next lesson"),
    "the CLOSURE-stage row is excluded from the visible Main Lesson table",
  );
  assert(html.includes("Assessment"), "renders the Assessment section");
  assert(html.includes("Convert 13 to binary on the whiteboard"), "renders the assessment description");
  assert(html.includes("Level 2"), "renders the DoK level label, not the raw enum");
  assert(html.includes("Lesson Closure"), "renders the Lesson Closure section");
  assert(
    html.includes("Summarize key points and preview next lesson"),
    "Lesson Closure section shows the closure teacher activity",
  );
  assert(html.includes("Reflection"), "renders the Reflection & Remarks section");
  assert(html.includes("Published"), "footer shows Published status");

  console.log("4) The app shell chrome (sidebar/nav) must be print:hidden, not absent");
  assert(html.includes("print:hidden"), "sidebar/header wrapper carries the print:hidden utility class");

  console.log(`\n${passed} passed, ${failed} failed`);

  await prisma.lessonPlanner.delete({ where: { id: plannerId } });

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

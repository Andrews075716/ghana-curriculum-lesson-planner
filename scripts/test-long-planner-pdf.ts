import { writeFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
import { loginAsDemoTeacher } from "./_lib/authed-session";

/**
 * Builds a deliberately LONG, fully-populated lesson planner (many
 * activities, long text in every field) to verify the print layout and PDF
 * export handle real multi-page content sensibly: page breaks don't
 * orphan headings mid-block, table rows stay intact, and repeated table
 * headers actually repeat. Saves the resulting PDF locally for visual
 * inspection instead of just asserting on byte counts.
 *
 *   npx tsx scripts/test-long-planner-pdf.ts
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

const LONG_PARAGRAPH =
  "The teacher circulates around the classroom, checking each group's whiteboard working, " +
  "asking probing questions about place value and prompting learners who are stuck to look back " +
  "at the worked example on the board, while also flagging any group that finishes early so they " +
  "can be given the extension challenge card instead of sitting idle.";

function repeat<T>(count: number, factory: (i: number) => T): T[] {
  return Array.from({ length: count }, (_, i) => factory(i));
}

async function main() {
  const session = await loginAsDemoTeacher();
  const postJson = session.post.bind(session);
  const patchJson = session.patch.bind(session);
  const getJson = session.get.bind(session);
  const authHeaders = { Cookie: session.toFetchCookieHeader() };

  console.log("1) Create a draft and fill Step 1 + 2");
  const created = await postJson("/api/planners");
  const plannerId: string = created.body.data.id;

  const indicatorRow = await prisma.learningIndicator.findFirstOrThrow({
    where: { code: "COMP-F1-STR-01-SS-01-CS-01-LI-01" },
  });

  await patchJson(`/api/planners/${plannerId}`, {
    classSection: "Form 1 Gold",
    term: "TERM_1",
    weekNumber: 6,
    lessonNumber: 1,
    lessonDate: "2026-09-16",
    durationMinutes: 240,
    learningIndicatorId: indicatorRow.id,
  });

  console.log("2) Fill Step 3 + 4 with long, multi-item content");
  const themesRes = await getJson("/api/cross-cutting-themes");
  const themeIds = themesRes.body.data.map((t: { id: string }) => t.id) as string[];

  await patchJson(`/api/planners/${plannerId}`, {
    essentialQuestions: repeat(8, (i) => `Essential question ${i + 1}: ${LONG_PARAGRAPH}`),
    crossCuttingThemes: themeIds.map((themeId) => ({
      themeId,
      explanation: LONG_PARAGRAPH,
    })),
    pedagogicalStrategies: repeat(6, (i) => `Strategy ${i + 1}: ${LONG_PARAGRAPH}`),
    teachingLearningResources: repeat(6, (i) => `Resource ${i + 1}: ${LONG_PARAGRAPH}`),
    keywords: repeat(15, (i) => `keyword-${i + 1}`),
    differentiation: {
      mixedAbilityGrouping: LONG_PARAGRAPH.repeat(2),
      scaffoldSupport: LONG_PARAGRAPH.repeat(2),
      extensionChallenge: LONG_PARAGRAPH.repeat(2),
      resourceAdaptation: LONG_PARAGRAPH.repeat(2),
      learningTaskDifferentiation: LONG_PARAGRAPH.repeat(2),
      teacherPeerSupport: LONG_PARAGRAPH.repeat(2),
      additionalNotes: LONG_PARAGRAPH.repeat(2),
    },
    learningTasks: repeat(6, (i) => `Learning task ${i + 1}: ${LONG_PARAGRAPH}`),
    pedagogicalExemplars: repeat(6, (i) => `Exemplar ${i + 1}: ${LONG_PARAGRAPH}`),
  });

  console.log("3) Fill Step 5 + 6 with MANY activities and assessments");
  const stages = ["STARTER", "INTRODUCTORY", "ACTIVITY", "ASSESSMENT"] as const;
  const lessonActivities = [
    ...repeat(20, (i) => ({
      stage: stages[i % stages.length],
      label: `Phase ${i + 1}`,
      sequence: i + 1,
      durationMinutes: 10,
      teacherActivity: `[Activity ${i + 1}] ${LONG_PARAGRAPH}`,
      learnerActivity: `[Activity ${i + 1}] ${LONG_PARAGRAPH}`,
    })),
    {
      stage: "CLOSURE" as const,
      label: "Lesson Closure",
      sequence: 21,
      durationMinutes: 10,
      teacherActivity: `Closure: ${LONG_PARAGRAPH}`,
      learnerActivity: `Closure: ${LONG_PARAGRAPH}`,
    },
  ];
  await patchJson(`/api/planners/${plannerId}`, {
    lessonActivities,
    assessments: repeat(10, (i) => ({
      dokLevel: (["LEVEL_1", "LEVEL_2", "LEVEL_3", "LEVEL_4"] as const)[i % 4],
      description: `Assessment item ${i + 1}: ${LONG_PARAGRAPH}`,
      sequence: i + 1,
    })),
  });

  console.log("4) Publish");
  const publishRes = await postJson(`/api/planners/${plannerId}/publish`);
  assert(publishRes.status === 200, "publish -> 200");

  console.log("5) Fetch the print page and sanity-check it's long");
  const printRes = await fetch(`${BASE_URL}/planners/${plannerId}/print`, { headers: authHeaders });
  assert(printRes.status === 200, "GET print page -> 200");
  const html = await printRes.text();
  assert(html.length > 20000, `print page HTML is substantial (${html.length} chars)`);
  assert(
    (html.match(/Phase \d+/g) ?? []).length >= 20,
    "all 20 main-lesson activity phases are present in the HTML",
  );

  console.log("6) Export to PDF via the API route and save it locally");
  const start = Date.now();
  const pdfRes = await fetch(`${BASE_URL}/api/planners/${plannerId}/pdf`, { headers: authHeaders });
  const elapsedMs = Date.now() - start;
  assert(pdfRes.status === 200, `GET pdf export -> 200 (took ${elapsedMs}ms)`);
  assert(
    pdfRes.headers.get("content-type") === "application/pdf",
    "response Content-Type is application/pdf",
  );
  const disposition = pdfRes.headers.get("content-disposition") ?? "";
  assert(
    disposition.startsWith("attachment;") && disposition.includes(".pdf"),
    `Content-Disposition triggers a download (got: "${disposition}")`,
  );

  const pdfBuffer = Buffer.from(await pdfRes.arrayBuffer());
  assert(pdfBuffer.length > 10000, `PDF is a substantial file (${pdfBuffer.length} bytes)`);
  assert(
    pdfBuffer.subarray(0, 5).toString("latin1") === "%PDF-",
    "response is a real PDF file (starts with %PDF- magic bytes)",
  );

  // Count pages via the PDF's own object structure ("/Type /Page" entries,
  // not "/Pages" the page-tree root) — good enough without a full PDF parser.
  const pdfText = pdfBuffer.toString("latin1");
  const pageMatches = pdfText.match(/\/Type\s*\/Page[^s]/g) ?? [];
  console.log(`    (info) approx. page count: ${pageMatches.length}`);
  assert(pageMatches.length >= 3, `PDF spans multiple pages (found ~${pageMatches.length})`);

  const outDir =
    process.env.PDF_TEST_OUT_DIR ??
    "C:/Users/WINDOWS11/AppData/Local/Temp/claude/C--GOLD-TEach/0db20dd5-8eb6-4120-9949-94c662e83030/scratchpad";
  await import("node:fs/promises").then((fs) => fs.mkdir(outDir, { recursive: true }));
  const outPath = `${outDir}/long-lesson-plan.pdf`;
  writeFileSync(outPath, pdfBuffer);
  console.log(`    (info) saved PDF to ${outPath} for visual inspection`);

  console.log(`\n${passed} passed, ${failed} failed`);
  console.log(`    (info) print page: ${BASE_URL}/planners/${plannerId}/print`);

  if (!process.env.KEEP_PLANNER) {
    await prisma.lessonPlanner.delete({ where: { id: plannerId } });
  }

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

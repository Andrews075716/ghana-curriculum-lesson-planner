import { PrismaClient } from "@prisma/client";
import { loginAsDemoTeacher } from "./_lib/authed-session";

/**
 * End-to-end test of the Assessments API: list across planners, filter by
 * Subject/Class/Strand/Learning Indicator/DoK Level. Run against a live dev
 * server + database:
 *
 *   npx tsx scripts/test-assessments-api.ts
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
  const createdPlannerIds: string[] = [];

  const indicatorRow = await prisma.learningIndicator.findFirstOrThrow({
    where: { code: "COMP-F1-STR-01-SS-01-CS-01-LI-01" },
  });
  const subject = await prisma.subject.findFirstOrThrow({ where: { name: "Computing" } });
  const classLevel = await prisma.classLevel.findFirstOrThrow({ where: { name: "SHS 1" } });
  const strand = await prisma.strand.findFirstOrThrow({
    where: { name: "Computer Architecture and Organisation" },
  });

  console.log("1) Create a fixture planner with two assessments (LEVEL_1 and LEVEL_3)");
  const created = await session.post("/api/planners");
  const plannerId: string = created.body.data.id;
  createdPlannerIds.push(plannerId);
  await session.patch(`/api/planners/${plannerId}`, {
    classSection: "Assessment Test Section",
    term: "TERM_1",
    weekNumber: 1,
    lessonNumber: 1,
    durationMinutes: 60,
    learningIndicatorId: indicatorRow.id,
  });
  await session.patch(`/api/planners/${plannerId}`, {
    lessonActivities: [
      {
        stage: "CLOSURE",
        label: "Lesson Closure",
        sequence: 1,
        durationMinutes: 10,
        teacherActivity: "Wrap up",
        learnerActivity: "Reflect",
      },
    ],
    assessments: [
      { dokLevel: "LEVEL_1", description: "Recall bit patterns", sequence: 1 },
      { dokLevel: "LEVEL_3", description: "Apply bit pattern strategy", sequence: 2 },
    ],
  });

  console.log("2) Unfiltered list includes both assessments with expected fields");
  const listRes = await session.get("/api/assessments");
  assert(listRes.status === 200, "GET /api/assessments -> 200");
  const rows: Array<{
    id: string;
    dokLevel: string;
    description: string;
    plannerId: string;
    lessonName: string | null;
    subjectName: string;
    strandName: string;
    learningIndicatorId: string | null;
  }> = listRes.body.data;
  const ourRows = rows.filter((r) => r.plannerId === plannerId);
  assert(ourRows.length === 2, `both fixture assessments appear (got ${ourRows.length})`);
  const level1 = ourRows.find((r) => r.dokLevel === "LEVEL_1");
  assert(level1?.description === "Recall bit patterns", "assessment description round-trips");
  assert(level1?.subjectName === "Computing", "resolved subjectName is correct");
  assert(level1?.strandName === "Computer Architecture and Organisation", "resolved strandName is correct");
  assert(level1?.lessonName?.startsWith("Lesson 1"), "resolved lessonName is correct");
  assert(level1?.learningIndicatorId === indicatorRow.id, "resolved learningIndicatorId is correct");

  console.log("3) Filter by dokLevel=LEVEL_1 excludes LEVEL_3");
  const dokFiltered = await session.get("/api/assessments?dokLevel=LEVEL_1");
  assert(dokFiltered.status === 200, "GET ?dokLevel=LEVEL_1 -> 200");
  const dokRows = (dokFiltered.body.data as typeof rows).filter((r) => r.plannerId === plannerId);
  assert(dokRows.length === 1 && dokRows[0].dokLevel === "LEVEL_1", "dokLevel filter narrows to LEVEL_1 only");

  console.log("4) Filter by subjectId + classLevelId");
  const subjectFiltered = await session.get(
    `/api/assessments?subjectId=${subject.id}&classLevelId=${classLevel.id}`,
  );
  assert(subjectFiltered.status === 200, "GET ?subjectId&classLevelId -> 200");
  assert(
    (subjectFiltered.body.data as typeof rows).some((r) => r.plannerId === plannerId),
    "subject+classLevel filter includes fixture assessments",
  );

  console.log("5) Filter by strandId");
  const strandFiltered = await session.get(`/api/assessments?strandId=${strand.id}`);
  assert(strandFiltered.status === 200, "GET ?strandId -> 200");
  assert(
    (strandFiltered.body.data as typeof rows).some((r) => r.plannerId === plannerId),
    "strand filter includes fixture assessments",
  );

  console.log("6) Filter by learningIndicatorId");
  const indicatorFiltered = await session.get(
    `/api/assessments?learningIndicatorId=${indicatorRow.id}`,
  );
  assert(indicatorFiltered.status === 200, "GET ?learningIndicatorId -> 200");
  assert(
    (indicatorFiltered.body.data as typeof rows).filter((r) => r.plannerId === plannerId).length === 2,
    "learningIndicator filter includes both fixture assessments",
  );

  console.log("7) A non-matching filter combination excludes the fixture");
  const otherIndicator = await prisma.learningIndicator.findFirstOrThrow({
    where: { id: { not: indicatorRow.id } },
  });
  const nonMatching = await session.get(
    `/api/assessments?learningIndicatorId=${otherIndicator.id}`,
  );
  assert(
    !(nonMatching.body.data as typeof rows).some((r) => r.plannerId === plannerId),
    "unrelated learningIndicator filter excludes fixture assessments",
  );

  console.log("8) Invalid filter value is rejected");
  const badFilter = await session.get("/api/assessments?dokLevel=NOT_A_LEVEL");
  assert(badFilter.status === 400, "GET ?dokLevel=bogus -> 400");

  console.log("Cleanup: removing fixture");
  for (const id of createdPlannerIds) {
    await session.delete(`/api/planners/${id}`);
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  await prisma.$disconnect();
  if (failed > 0) process.exit(1);
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});

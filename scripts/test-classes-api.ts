import { PrismaClient } from "@prisma/client";
import { loginAsDemoTeacher } from "./_lib/authed-session";

/**
 * End-to-end test of the Classes API: create/list/view/edit/archive, plus
 * the planner-count-by-classSection matching and ownership scoping. Run
 * against a live dev server + database:
 *
 *   npx tsx scripts/test-classes-api.ts
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
  const createdClassIds: string[] = [];
  const createdPlannerIds: string[] = [];

  const subject = await prisma.subject.findFirstOrThrow({ where: { name: "Computing" } });
  const classLevel = await prisma.classLevel.findFirstOrThrow({ where: { name: "SHS 1" } });

  console.log("1) Create a class");
  const created = await session.post("/api/classes", {
    name: "Form 1 Gold",
    classLevelId: classLevel.id,
    subjectId: subject.id,
    academicYear: "2025/2026",
    notes: "Meets Mon/Wed/Fri",
  });
  assert(created.status === 201, "POST /api/classes -> 201");
  const classId: string = created.body.data.id;
  createdClassIds.push(classId);

  console.log("2) List includes the new class with zero planners");
  const listRes = await session.get("/api/classes");
  assert(listRes.status === 200, "GET /api/classes -> 200");
  const rows: Array<{
    id: string;
    name: string;
    classLevelName: string;
    subjectName: string;
    plannerCount: number;
    archived: boolean;
  }> = listRes.body.data;
  const row = rows.find((r) => r.id === classId);
  assert(row !== undefined, "new class appears in the list");
  assert(row?.classLevelName === "SHS 1", "row resolves classLevelName");
  assert(row?.subjectName === "Computing", "row resolves subjectName");
  assert(row?.plannerCount === 0, "plannerCount is 0 before any matching planner exists");
  assert(row?.archived === false, "new class is not archived");

  console.log("3) View a single class");
  const viewRes = await session.get(`/api/classes/${classId}`);
  assert(viewRes.status === 200, "GET /api/classes/:id -> 200");
  assert(viewRes.body.data.name === "Form 1 Gold", "view returns the correct name");

  console.log("4) Creating a matching-classSection planner increments plannerCount");
  const draftRes = await session.post("/api/planners");
  const plannerId: string = draftRes.body.data.id;
  createdPlannerIds.push(plannerId);
  await session.patch(`/api/planners/${plannerId}`, { classSection: "Form 1 Gold" });
  const listAfterPlanner = await session.get("/api/classes");
  const rowAfterPlanner = (
    listAfterPlanner.body.data as Array<{ id: string; plannerCount: number }>
  ).find((r) => r.id === classId);
  assert(rowAfterPlanner?.plannerCount === 1, "plannerCount becomes 1 after a matching classSection");

  console.log("5) Edit the class");
  const editRes = await session.patch(`/api/classes/${classId}`, {
    name: "Form 1 Gold (Updated)",
    classLevelId: classLevel.id,
    subjectId: subject.id,
    academicYear: "2025/2026",
    notes: null,
  });
  assert(editRes.status === 200, "PATCH /api/classes/:id -> 200");
  const afterEdit = await session.get(`/api/classes/${classId}`);
  assert(afterEdit.body.data.name === "Form 1 Gold (Updated)", "edited name round-trips");
  assert(afterEdit.body.data.notes === null, "notes cleared to null round-trips");

  console.log("6) Validation errors");
  const badCreate = await session.post("/api/classes", { name: "" });
  assert(badCreate.status === 400, "create with missing fields -> 400");

  const badRefs = await session.post("/api/classes", {
    name: "Bad Refs",
    classLevelId: "does-not-exist",
    subjectId: subject.id,
    academicYear: "2025/2026",
  });
  assert(badRefs.status === 404, "create with unknown classLevelId -> 404");

  console.log("7) Archive and unarchive");
  const archiveRes = await session.patch(`/api/classes/${classId}/archive`, { archived: true });
  assert(archiveRes.status === 200, "PATCH /api/classes/:id/archive -> 200");
  const afterArchive = await session.get(`/api/classes/${classId}`);
  assert(afterArchive.body.data.archived === true, "archived flag set");
  const unarchiveRes = await session.patch(`/api/classes/${classId}/archive`, { archived: false });
  assert(unarchiveRes.status === 200, "un-archive -> 200");
  const afterUnarchive = await session.get(`/api/classes/${classId}`);
  assert(afterUnarchive.body.data.archived === false, "archived flag cleared");

  console.log("8) Not-found for unknown/foreign class id");
  const missing = await session.get("/api/classes/not-a-real-id");
  assert(missing.status === 404, "GET unknown class id -> 404");
  const missingPatch = await session.patch("/api/classes/not-a-real-id", {
    name: "X",
    classLevelId: classLevel.id,
    subjectId: subject.id,
    academicYear: "2025/2026",
  });
  assert(missingPatch.status === 404, "PATCH unknown class id -> 404");

  console.log("Cleanup: removing fixtures");
  for (const id of createdPlannerIds) {
    await session.delete(`/api/planners/${id}`);
  }
  for (const id of createdClassIds) {
    await prisma.class.deleteMany({ where: { id } });
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

import { PrismaClient } from "@prisma/client";
import { loginAsDemoTeacher } from "./_lib/authed-session";

/**
 * End-to-end test of the My Planners backend: list/search/filter, delete,
 * and duplicate. Creates and publishes its own fixture planners, then
 * deletes everything it created. Run against a live dev server + database:
 *
 *   npx tsx scripts/test-planner-list-api.ts
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

async function completePlanner(
  session: Awaited<ReturnType<typeof loginAsDemoTeacher>>,
  indicatorId: string,
  classSection: string,
) {
  const created = await session.post("/api/planners");
  const plannerId: string = created.body.data.id;
  await session.patch(`/api/planners/${plannerId}`, {
    classSection,
    term: "TERM_1",
    weekNumber: 3,
    lessonNumber: 1,
    durationMinutes: 60,
    learningIndicatorId: indicatorId,
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
    assessments: [{ dokLevel: "LEVEL_1", description: "Quick check", sequence: 1 }],
  });
  return plannerId;
}

async function main() {
  const session = await loginAsDemoTeacher();
  const createdIds: string[] = [];

  const indicatorRow = await prisma.learningIndicator.findFirstOrThrow({
    where: { code: "COMP-F1-STR-01-SS-01-CS-01-LI-01" },
  });

  console.log("1) Create a draft and a published planner as list fixtures");
  const draftId = await completePlanner(session, indicatorRow.id, "Form 1 Draft Section");
  createdIds.push(draftId);
  const publishTargetId = await completePlanner(session, indicatorRow.id, "Form 1 Published Section");
  createdIds.push(publishTargetId);
  const publishRes = await session.post(`/api/planners/${publishTargetId}/publish`);
  assert(publishRes.status === 200, "POST /api/planners/:id/publish -> 200");

  console.log("2) List (unfiltered) includes both fixtures with expected fields");
  const listRes = await session.get("/api/planners");
  assert(listRes.status === 200, "GET /api/planners -> 200");
  const rows: Array<{ id: string; classSection: string | null; status: string; topic: string }> =
    listRes.body.data;
  assert(Array.isArray(rows), "response data is an array");
  assert(
    rows.some((r) => r.id === draftId),
    "draft fixture appears in unfiltered list",
  );
  assert(
    rows.some((r) => r.id === publishTargetId),
    "second fixture appears in unfiltered list",
  );
  const draftRow = rows.find((r) => r.id === draftId);
  assert(draftRow?.classSection === "Form 1 Draft Section", "row exposes classSection");
  assert(typeof draftRow?.topic === "string" && draftRow.topic.length > 0, "row exposes a resolved topic");

  console.log("3) Filter by status=DRAFT excludes the published fixture");
  const draftOnly = await session.get("/api/planners?status=DRAFT");
  assert(draftOnly.status === 200, "GET /api/planners?status=DRAFT -> 200");
  assert(
    (draftOnly.body.data as Array<{ id: string }>).some((r) => r.id === draftId),
    "DRAFT filter includes the draft fixture",
  );
  assert(
    (draftOnly.body.data as Array<{ id: string }>).every((r) => r.id !== publishTargetId),
    "DRAFT filter excludes the published fixture",
  );

  console.log("4) Search by class section text");
  const searchRes = await session.get("/api/planners?search=Draft%20Section");
  assert(searchRes.status === 200, "GET /api/planners?search=... -> 200");
  assert(
    (searchRes.body.data as Array<{ id: string }>).some((r) => r.id === draftId),
    "search matches classSection substring",
  );
  assert(
    (searchRes.body.data as Array<{ id: string }>).every((r) => r.id !== publishTargetId),
    "search excludes non-matching fixture",
  );

  console.log("5) Filter by term=TERM_2 excludes TERM_1 fixtures");
  const termFiltered = await session.get("/api/planners?term=TERM_2");
  assert(termFiltered.status === 200, "GET /api/planners?term=TERM_2 -> 200");
  assert(
    (termFiltered.body.data as Array<{ id: string }>).every((r) => r.id !== draftId && r.id !== publishTargetId),
    "TERM_2 filter excludes TERM_1 fixtures",
  );

  console.log("6) Invalid filter value is rejected");
  const badFilter = await session.get("/api/planners?status=NOT_A_STATUS");
  assert(badFilter.status === 400, "GET /api/planners?status=bogus -> 400");

  console.log("7) Duplicate creates a new DRAFT copy, original untouched");
  const dupRes = await session.post(`/api/planners/${draftId}/duplicate`);
  assert(dupRes.status === 201, "POST /api/planners/:id/duplicate -> 201");
  const dupId: string = dupRes.body.data.id;
  assert(typeof dupId === "string" && dupId !== draftId, "duplicate returns a distinct id");
  createdIds.push(dupId);
  const dupDraft = await session.get(`/api/planners/${dupId}`);
  assert(dupDraft.body.data.status === "DRAFT", "duplicate is always a DRAFT");
  assert(dupDraft.body.data.classSection === "Form 1 Draft Section", "duplicate copied classSection");
  assert(
    dupDraft.body.data.lesson.assessments.length === 1,
    "duplicate copied the lesson's assessments",
  );
  const originalStillThere = await session.get(`/api/planners/${draftId}`);
  assert(originalStillThere.status === 200, "original planner untouched after duplication");

  console.log("8) Duplicating a nonexistent id is a 404");
  const dupMissing = await session.post("/api/planners/not-a-real-id/duplicate");
  assert(dupMissing.status === 404, "duplicate of unknown id -> 404");

  console.log("9) Delete removes a planner; it then disappears from GET and from the list");
  const deleteRes = await session.delete(`/api/planners/${dupId}`);
  assert(deleteRes.status === 200, "DELETE /api/planners/:id -> 200");
  const afterDelete = await session.get(`/api/planners/${dupId}`);
  assert(afterDelete.status === 404, "GET after delete -> 404");
  const listAfterDelete = await session.get("/api/planners");
  assert(
    (listAfterDelete.body.data as Array<{ id: string }>).every((r) => r.id !== dupId),
    "deleted planner no longer appears in the list",
  );
  createdIds.splice(createdIds.indexOf(dupId), 1);

  console.log("10) Deleting a nonexistent id is a 404 (not silently ok)");
  const deleteMissing = await session.delete("/api/planners/not-a-real-id");
  assert(deleteMissing.status === 404, "delete of unknown id -> 404");

  console.log("Cleanup: removing remaining fixtures");
  for (const id of createdIds) {
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

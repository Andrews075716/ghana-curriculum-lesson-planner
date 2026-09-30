import { PrismaClient } from "@prisma/client";
import { loginAsDemoTeacher } from "./_lib/authed-session";

/**
 * End-to-end test of the Resources library API: create/list/view/edit/
 * delete, plus associating/detaching a resource from a planner and
 * ownership scoping. Run against a live dev server + database:
 *
 *   npx tsx scripts/test-resources-api.ts
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
  const createdResourceIds: string[] = [];
  const createdPlannerIds: string[] = [];

  console.log("1) Create a resource");
  const created = await session.post("/api/resources", {
    title: "Binary Numbers Video",
    type: "VIDEO",
    url: "https://example.com/binary-numbers",
    description: "A short explainer video on binary representation.",
  });
  assert(created.status === 201, "POST /api/resources -> 201");
  const resourceId: string = created.body.data.id;
  createdResourceIds.push(resourceId);

  console.log("2) List includes the new resource");
  const listRes = await session.get("/api/resources");
  assert(listRes.status === 200, "GET /api/resources -> 200");
  const rows: Array<{
    id: string;
    title: string;
    type: string;
    associatedPlanners: Array<{ id: string; topic: string }>;
  }> = listRes.body.data;
  const row = rows.find((r) => r.id === resourceId);
  assert(row !== undefined, "new resource appears in the list");
  assert(row?.type === "VIDEO", "type round-trips");
  assert(row?.associatedPlanners.length === 0, "no associated planners yet");

  console.log("3) View a single resource");
  const viewRes = await session.get(`/api/resources/${resourceId}`);
  assert(viewRes.status === 200, "GET /api/resources/:id -> 200");
  assert(viewRes.body.data.title === "Binary Numbers Video", "view returns the correct title");

  console.log("4) Edit the resource");
  const editRes = await session.patch(`/api/resources/${resourceId}`, {
    title: "Binary Numbers Video (Updated)",
    type: "VIDEO",
    url: "",
    description: null,
  });
  assert(editRes.status === 200, "PATCH /api/resources/:id -> 200");
  const afterEdit = await session.get(`/api/resources/${resourceId}`);
  assert(afterEdit.body.data.title === "Binary Numbers Video (Updated)", "edited title round-trips");
  assert(afterEdit.body.data.url === null, "empty url string normalizes to null");

  console.log("5) Validation errors");
  const badCreate = await session.post("/api/resources", { title: "", type: "VIDEO" });
  assert(badCreate.status === 400, "create with empty title -> 400");
  const badUrl = await session.post("/api/resources", {
    title: "Bad URL",
    type: "LINK",
    url: "not-a-url",
  });
  assert(badUrl.status === 400, "create with invalid url -> 400");

  console.log("6) Associate with a planner");
  const draftRes = await session.post("/api/planners");
  const plannerId: string = draftRes.body.data.id;
  createdPlannerIds.push(plannerId);
  const assocRes = await session.patch(`/api/resources/${resourceId}/associations`, {
    plannerId,
    associated: true,
  });
  assert(assocRes.status === 200, "PATCH .../associations (attach) -> 200");
  const afterAssoc = await session.get(`/api/resources/${resourceId}`);
  assert(
    afterAssoc.body.data.associatedPlanners.some((p: { id: string }) => p.id === plannerId),
    "planner appears in associatedPlanners after attach",
  );

  console.log("7) Associating twice is idempotent (no duplicate/crash)");
  const assocAgain = await session.patch(`/api/resources/${resourceId}/associations`, {
    plannerId,
    associated: true,
  });
  assert(assocAgain.status === 200, "re-attaching the same planner -> 200 (idempotent)");
  const afterAssocAgain = await session.get(`/api/resources/${resourceId}`);
  assert(
    afterAssocAgain.body.data.associatedPlanners.length === 1,
    "no duplicate association row created",
  );

  console.log("8) Detach the association");
  const detachRes = await session.patch(`/api/resources/${resourceId}/associations`, {
    plannerId,
    associated: false,
  });
  assert(detachRes.status === 200, "PATCH .../associations (detach) -> 200");
  const afterDetach = await session.get(`/api/resources/${resourceId}`);
  assert(afterDetach.body.data.associatedPlanners.length === 0, "planner removed after detach");

  console.log("9) Associating with an unowned/unknown planner -> 404");
  const badAssoc = await session.patch(`/api/resources/${resourceId}/associations`, {
    plannerId: "not-a-real-id",
    associated: true,
  });
  assert(badAssoc.status === 404, "associate with unknown planner id -> 404");

  console.log("10) Delete the resource");
  const deleteRes = await session.delete(`/api/resources/${resourceId}`);
  assert(deleteRes.status === 200, "DELETE /api/resources/:id -> 200");
  const afterDelete = await session.get(`/api/resources/${resourceId}`);
  assert(afterDelete.status === 404, "GET after delete -> 404");

  console.log("11) Not-found for unknown resource id");
  const missingDelete = await session.delete("/api/resources/not-a-real-id");
  assert(missingDelete.status === 404, "DELETE unknown resource id -> 404");

  console.log("Cleanup: removing remaining fixtures");
  for (const id of createdPlannerIds) {
    await session.delete(`/api/planners/${id}`);
  }
  for (const id of createdResourceIds) {
    await prisma.resource.deleteMany({ where: { id } });
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

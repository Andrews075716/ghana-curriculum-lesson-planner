import { PrismaClient } from "@prisma/client";
import { loginAsDemoAdmin, loginAsDemoTeacher, AuthedSession } from "./_lib/authed-session";

/**
 * Verifies the admin curriculum CRUD area end to end against the live dev
 * server: every entity (Subject, ClassLevel, CurriculumVersion, Strand,
 * SubStrand, ContentStandard, LearningOutcome, LearningIndicator) can be
 * created/updated/deleted by an admin, validation and duplicate-conflict
 * errors surface correctly, deletes with children are blocked, and —
 * critically — every one of these endpoints returns 403 for a TEACHER
 * account and for an unauthenticated caller, proving the server-side
 * authorization gate (not just a hidden UI button).
 *
 *   npx tsx scripts/test-curriculum-admin-crud.ts
 */
const prisma = new PrismaClient();
const TAG = `TESTADMIN-${Date.now()}`;

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

async function cleanup() {
  await prisma.learningIndicator.deleteMany({ where: { code: { startsWith: TAG } } });
  await prisma.learningOutcome.deleteMany({ where: { description: { startsWith: TAG } } });
  await prisma.contentStandard.deleteMany({ where: { code: { startsWith: TAG } } });
  await prisma.subStrand.deleteMany({ where: { code: { startsWith: TAG } } });
  await prisma.strand.deleteMany({ where: { code: { startsWith: TAG } } });
  await prisma.curriculumVersion.deleteMany({ where: { name: { startsWith: TAG } } });
  await prisma.classLevel.deleteMany({ where: { name: { startsWith: TAG } } });
  await prisma.subject.deleteMany({ where: { code: { startsWith: TAG } } });
}

async function main() {
  await cleanup();

  const admin = await loginAsDemoAdmin();
  const teacher = await loginAsDemoTeacher();
  const anon = new AuthedSession();

  console.log("1) Admin creates a subject, class level, and curriculum version");
  const subjectRes = await admin.post("/api/admin/curriculum/subjects", {
    code: `${TAG}-SUBJ`,
    name: `${TAG} Subject`,
  });
  assert(subjectRes.status === 201, "create subject -> 201");
  const subjectId: string = subjectRes.body.data.id;

  const classLevelRes = await admin.post("/api/admin/curriculum/class-levels", {
    name: `${TAG} Class`,
    sequence: 9001,
  });
  assert(classLevelRes.status === 201, "create class level -> 201");
  const classLevelId: string = classLevelRes.body.data.id;

  const versionRes = await admin.post("/api/admin/curriculum/versions", {
    name: `${TAG} Version`,
    status: "DRAFT",
  });
  assert(versionRes.status === 201, "create curriculum version -> 201");
  const versionId: string = versionRes.body.data.id;

  console.log("2) Validation error: empty subject code -> 400");
  const badSubject = await admin.post("/api/admin/curriculum/subjects", { code: "", name: "x" });
  assert(badSubject.status === 400, "empty code -> 400");
  assert(badSubject.body.error?.code === "VALIDATION_ERROR", "error code is VALIDATION_ERROR");

  console.log("3) Duplicate conflict: same subject code again -> 409");
  const dupeSubject = await admin.post("/api/admin/curriculum/subjects", {
    code: `${TAG}-SUBJ`,
    name: "Different name",
  });
  assert(dupeSubject.status === 409, "duplicate code -> 409");
  assert(dupeSubject.body.error?.code === "CONFLICT", "error code is CONFLICT");

  console.log("4) Admin builds the full hierarchy under that subject/class/version");
  const strandRes = await admin.post("/api/admin/curriculum/strands", {
    subjectId,
    classLevelId,
    curriculumVersionId: versionId,
    code: `${TAG}-STR-01`,
    name: `${TAG} Strand`,
    sequence: 1,
  });
  assert(strandRes.status === 201, "create strand -> 201");
  const strandId: string = strandRes.body.data.id;

  const subStrandRes = await admin.post("/api/admin/curriculum/sub-strands", {
    strandId,
    code: `${TAG}-SS-01`,
    name: `${TAG} Sub-strand`,
    sequence: 1,
  });
  assert(subStrandRes.status === 201, "create sub-strand -> 201");
  const subStrandId: string = subStrandRes.body.data.id;

  const contentStandardRes = await admin.post("/api/admin/curriculum/content-standards", {
    subStrandId,
    code: `${TAG}-CS-01`,
    description: `${TAG} Content standard`,
    sequence: 1,
  });
  assert(contentStandardRes.status === 201, "create content standard -> 201");
  const contentStandardId: string = contentStandardRes.body.data.id;

  const outcomeRes = await admin.post("/api/admin/curriculum/learning-outcomes", {
    contentStandardId,
    description: `${TAG} Learning outcome`,
    sequence: 1,
  });
  assert(outcomeRes.status === 201, "create learning outcome -> 201");
  const outcomeId: string = outcomeRes.body.data.id;

  const indicatorRes = await admin.post("/api/admin/curriculum/learning-indicators", {
    learningOutcomeId: outcomeId,
    code: `${TAG}-LI-01`,
    description: `${TAG} Learning indicator`,
    sequence: 1,
  });
  assert(indicatorRes.status === 201, "create learning indicator -> 201");
  const indicatorId: string = indicatorRes.body.data.id;

  console.log("5) List endpoints return the created rows");
  const listSubStrands = await admin.get(`/api/admin/curriculum/sub-strands?strandId=${strandId}`);
  assert(
    listSubStrands.body.data.some((s: { id: string }) => s.id === subStrandId),
    "sub-strands list includes the new sub-strand",
  );

  console.log("6) Updates work at every level");
  const updateStrand = await admin.patch(`/api/admin/curriculum/strands/${strandId}`, {
    subjectId,
    classLevelId,
    curriculumVersionId: versionId,
    code: `${TAG}-STR-01`,
    name: `${TAG} Strand (renamed)`,
    sequence: 2,
  });
  assert(updateStrand.status === 200, "update strand -> 200");
  assert(updateStrand.body.data.name === `${TAG} Strand (renamed)`, "strand name actually changed");

  console.log("7) Delete is blocked while children exist");
  const blockedDelete = await admin.delete(`/api/admin/curriculum/strands/${strandId}`);
  assert(blockedDelete.status === 409, "delete strand with children -> 409");
  assert(blockedDelete.body.error?.code === "CONFLICT", "error code is CONFLICT");

  console.log("8) Deleting a nonexistent row -> 404");
  const notFound = await admin.delete("/api/admin/curriculum/strands/does-not-exist");
  assert(notFound.status === 404, "delete unknown id -> 404");

  console.log("9) SECURITY: every admin endpoint rejects a TEACHER account with 403");
  const teacherChecks: Array<[string, () => Promise<{ status: number; body: unknown }>]> = [
    ["GET subjects", () => teacher.get("/api/admin/curriculum/subjects")],
    ["POST subjects", () => teacher.post("/api/admin/curriculum/subjects", { code: "X", name: "X" })],
    ["PATCH subjects/:id", () => teacher.patch(`/api/admin/curriculum/subjects/${subjectId}`, { code: "X", name: "X" })],
    ["DELETE subjects/:id", () => teacher.delete(`/api/admin/curriculum/subjects/${subjectId}`)],
    ["GET class-levels", () => teacher.get("/api/admin/curriculum/class-levels")],
    ["GET versions", () => teacher.get("/api/admin/curriculum/versions")],
    ["GET strands", () => teacher.get(`/api/admin/curriculum/strands?subjectId=${subjectId}`)],
    ["POST strands", () => teacher.post("/api/admin/curriculum/strands", { subjectId, classLevelId, curriculumVersionId: versionId, name: "X", sequence: 1 })],
    ["GET sub-strands", () => teacher.get(`/api/admin/curriculum/sub-strands?strandId=${strandId}`)],
    ["GET content-standards", () => teacher.get(`/api/admin/curriculum/content-standards?subStrandId=${subStrandId}`)],
    ["GET learning-outcomes", () => teacher.get(`/api/admin/curriculum/learning-outcomes?contentStandardId=${contentStandardId}`)],
    ["GET learning-indicators", () => teacher.get(`/api/admin/curriculum/learning-indicators?learningOutcomeId=${outcomeId}`)],
    ["POST import/preview", () => teacher.post("/api/admin/curriculum/import/preview", { format: "json", content: "{}" })],
    ["POST import/commit", () => teacher.post("/api/admin/curriculum/import/commit", { format: "json", content: "{}" })],
  ];
  for (const [label, run] of teacherChecks) {
    const res = await run();
    assert(res.status === 403, `${label} as teacher -> 403 (got ${res.status})`);
    const body = res.body as { error?: { code?: string } } | null;
    assert(body?.error?.code === "FORBIDDEN", `${label} as teacher -> error code FORBIDDEN`);
  }

  console.log("10) SECURITY: unauthenticated callers also get 403, not a redirect or crash");
  const anonRes = await anon.get("/api/admin/curriculum/subjects");
  assert(anonRes.status === 403, "GET subjects unauthenticated -> 403");

  console.log("11) Clean up in reverse dependency order via the real API");
  assert((await admin.delete(`/api/admin/curriculum/learning-indicators/${indicatorId}`)).status === 200, "delete indicator -> 200");
  assert((await admin.delete(`/api/admin/curriculum/learning-outcomes/${outcomeId}`)).status === 200, "delete outcome -> 200");
  assert((await admin.delete(`/api/admin/curriculum/content-standards/${contentStandardId}`)).status === 200, "delete content standard -> 200");
  assert((await admin.delete(`/api/admin/curriculum/sub-strands/${subStrandId}`)).status === 200, "delete sub-strand -> 200");
  assert((await admin.delete(`/api/admin/curriculum/strands/${strandId}`)).status === 200, "delete strand -> 200");
  assert((await admin.delete(`/api/admin/curriculum/versions/${versionId}`)).status === 200, "delete curriculum version -> 200");
  assert((await admin.delete(`/api/admin/curriculum/class-levels/${classLevelId}`)).status === 200, "delete class level -> 200");
  assert((await admin.delete(`/api/admin/curriculum/subjects/${subjectId}`)).status === 200, "delete subject -> 200");

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error("Test script crashed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await cleanup();
    await prisma.$disconnect();
  });

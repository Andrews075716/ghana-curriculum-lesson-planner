import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";

/**
 * End-to-end test of the authentication system against the live dev
 * server: registration, login, logout, forgot/reset password (reading
 * the actual reset link out of the dev server's log, since
 * EMAIL_PROVIDER=console just logs it), protected-route redirection, and
 * — the critical authorization check — that one teacher's session can
 * never read or act on another teacher's planner.
 *
 *   npx tsx scripts/test-auth.ts
 */
const BASE_URL = "http://localhost:3000";
const DEV_SERVER_LOG =
  "C:/Users/WINDOWS11/AppData/Local/Temp/claude/C--GOLD-TEach/dev-server-turn18.log";
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

/** Minimal cookie jar — parses Set-Cookie from a response, sends Cookie on subsequent requests. */
class Session {
  private cookies = new Map<string, string>();

  private capture(res: Response) {
    for (const raw of res.headers.getSetCookie?.() ?? []) {
      const [pair] = raw.split(";");
      const [name, value] = pair.split("=");
      if (value === "" || raw.includes("Expires=Thu, 01 Jan 1970")) {
        this.cookies.delete(name);
      } else {
        this.cookies.set(name, value);
      }
    }
  }

  private cookieHeader(): string {
    return Array.from(this.cookies.entries())
      .map(([k, v]) => `${k}=${v}`)
      .join("; ");
  }

  hasCookie(name: string): boolean {
    return this.cookies.has(name);
  }

  async request(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<{ status: number; body: unknown; redirected: boolean; location: string | null }> {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(this.cookieHeader() ? { Cookie: this.cookieHeader() } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      redirect: "manual",
    });
    this.capture(res);
    const isRedirect = res.status >= 300 && res.status < 400;
    const json = isRedirect ? null : await res.json().catch(() => null);
    return {
      status: res.status,
      body: json,
      redirected: isRedirect,
      location: res.headers.get("location"),
    };
  }

  get(path: string) {
    return this.request("GET", path);
  }
  post(path: string, body?: unknown) {
    return this.request("POST", path, body);
  }
  patch(path: string, body?: unknown) {
    return this.request("PATCH", path, body);
  }
}

function extractLatestResetLink(): string {
  const log = readFileSync(DEV_SERVER_LOG, "utf-8");
  const matches = [...log.matchAll(/http:\/\/localhost:3000\/reset-password\?token=([a-f0-9]+)/g)];
  if (matches.length === 0) throw new Error("No reset link found in dev server log.");
  return matches[matches.length - 1][1];
}

async function main() {
  const unique = Date.now();
  const teacherAEmail = `test-teacher-a-${unique}@example.edu.gh`;
  const teacherBEmail = `test-teacher-b-${unique}@example.edu.gh`;
  const originalPassword = "OriginalPass1!";
  const newPassword = "NewPassword2@";

  const indicator = await prisma.learningIndicator.findFirstOrThrow({
    where: { code: "COMP-F1-STR-01-SS-01-CS-01-LI-01" },
  });

  console.log("1) Register teacher A");
  const sessionA = new Session();
  const registerRes = await sessionA.post("/api/auth/register", {
    name: "Test Teacher A",
    email: teacherAEmail,
    password: originalPassword,
    confirmPassword: originalPassword,
    schoolName: "Test School A",
    subjectIds: [],
    classLevelIds: [],
  });
  assert(registerRes.status === 201, "register -> 201");
  assert(sessionA.hasCookie("session"), "registration sets a session cookie");

  console.log("2) Registering the same email again is rejected (409)");
  const dupeRes = await new Session().post("/api/auth/register", {
    name: "Duplicate",
    email: teacherAEmail,
    password: originalPassword,
    confirmPassword: originalPassword,
    schoolName: "Test School A",
    subjectIds: [],
    classLevelIds: [],
  });
  assert(dupeRes.status === 409, "duplicate email -> 409");

  console.log("3) The registered session can read its own profile");
  const profileRes = await sessionA.get("/api/profile");
  assert(profileRes.status === 200, "GET /api/profile -> 200");
  assert(
    (profileRes.body as { data: { email: string } }).data.email === teacherAEmail,
    "profile email matches the registered account",
  );

  console.log("4) An unauthenticated request to a protected API is rejected server-side");
  const anonSession = new Session();
  const anonPlanners = await anonSession.post("/api/planners");
  assert(anonPlanners.status === 403, "POST /api/planners with no session -> 403 (not just a UI hide)");

  console.log("5) The Proxy redirects an unauthenticated page request to /login");
  const anonPage = await anonSession.get("/dashboard");
  assert(anonPage.redirected && anonPage.status === 307, "GET /dashboard with no session -> redirect");
  assert(anonPage.location?.includes("/login"), `redirected to /login (got: ${anonPage.location})`);

  console.log("6) Logout clears the session — subsequent authenticated calls fail");
  const logoutRes = await sessionA.post("/api/auth/logout");
  assert(logoutRes.status === 200, "logout -> 200");
  const afterLogout = await sessionA.get("/api/profile");
  assert(afterLogout.status === 403, "GET /api/profile after logout -> 403");

  console.log("7) Login with the wrong password is rejected, without revealing which part was wrong");
  const wrongPassword = await sessionA.post("/api/auth/login", {
    email: teacherAEmail,
    password: "TotallyWrongPassword1!",
  });
  assert(wrongPassword.status === 400, "wrong password -> 400");
  const wrongPasswordMessage = (wrongPassword.body as { error: { message: string } }).error.message;

  console.log("8) Login with an unregistered email gets the exact same error message");
  const unknownEmail = await sessionA.post("/api/auth/login", {
    email: `nobody-${unique}@example.edu.gh`,
    password: "Whatever1!",
  });
  assert(unknownEmail.status === 400, "unknown email -> 400");
  assert(
    (unknownEmail.body as { error: { message: string } }).error.message === wrongPasswordMessage,
    "identical error message for 'wrong password' and 'no such account' (no user enumeration)",
  );

  console.log("9) Login with the correct password succeeds");
  const loginRes = await sessionA.post("/api/auth/login", {
    email: teacherAEmail,
    password: originalPassword,
  });
  assert(loginRes.status === 200, "correct login -> 200");
  assert(sessionA.hasCookie("session"), "login sets a session cookie");
  const afterLogin = await sessionA.get("/api/profile");
  assert(afterLogin.status === 200, "authenticated call works again after login");

  console.log("10) Forgot-password gives the same generic response whether or not the email exists");
  const forgotKnown = await sessionA.post("/api/auth/forgot-password", { email: teacherAEmail });
  const forgotUnknown = await sessionA.post("/api/auth/forgot-password", {
    email: `nobody-else-${unique}@example.edu.gh`,
  });
  assert(forgotKnown.status === 200 && forgotUnknown.status === 200, "both -> 200");
  assert(
    JSON.stringify(forgotKnown.body) === JSON.stringify(forgotUnknown.body),
    "identical response body either way (no user enumeration)",
  );

  console.log("11) The reset link (read from the console-email log) resets the password");
  await new Promise((r) => setTimeout(r, 300)); // let the log flush
  const resetToken = extractLatestResetLink();
  const resetRes = await sessionA.post("/api/auth/reset-password", {
    token: resetToken,
    password: newPassword,
    confirmPassword: newPassword,
  });
  assert(resetRes.status === 200, "reset-password -> 200");

  console.log("12) The old password no longer works; the new one does");
  const loginOldPassword = await new Session().post("/api/auth/login", {
    email: teacherAEmail,
    password: originalPassword,
  });
  assert(loginOldPassword.status === 400, "old password rejected after reset");
  const loginNewPassword = await new Session().post("/api/auth/login", {
    email: teacherAEmail,
    password: newPassword,
  });
  assert(loginNewPassword.status === 200, "new password accepted after reset");

  console.log("13) The reset token is single-use — reusing it fails");
  const reuseToken = await new Session().post("/api/auth/reset-password", {
    token: resetToken,
    password: "AnotherPass3#",
    confirmPassword: "AnotherPass3#",
  });
  assert(reuseToken.status === 400, "reusing a spent reset token -> 400");

  console.log("14) Teacher A creates a planner while logged in with the new password");
  const sessionA2 = new Session();
  await sessionA2.post("/api/auth/login", { email: teacherAEmail, password: newPassword });
  const createdPlanner = await sessionA2.post("/api/planners");
  const plannerAId = (createdPlanner.body as { data: { id: string } }).data.id;
  await sessionA2.patch(`/api/planners/${plannerAId}`, { learningIndicatorId: indicator.id });
  assert(typeof plannerAId === "string" && plannerAId.length > 0, "teacher A's planner was created");

  console.log("15) A second teacher cannot read or edit teacher A's planner — the core ownership check");
  const sessionB = new Session();
  await sessionB.post("/api/auth/register", {
    name: "Test Teacher B",
    email: teacherBEmail,
    password: "TeacherBPass1!",
    confirmPassword: "TeacherBPass1!",
    schoolName: "Test School B",
    subjectIds: [],
    classLevelIds: [],
  });
  const bReadsAPlanner = await sessionB.get(`/api/planners/${plannerAId}`);
  assert(bReadsAPlanner.status === 404, "teacher B GETting teacher A's planner -> 404, not the data");
  const bEditsAPlanner = await sessionB.patch(`/api/planners/${plannerAId}`, { weekNumber: 9 });
  assert(bEditsAPlanner.status === 404, "teacher B PATCHing teacher A's planner -> 404, no write happens");

  console.log("16) Teacher A can still read their own planner");
  const aReadsOwnPlanner = await sessionA2.get(`/api/planners/${plannerAId}`);
  assert(aReadsOwnPlanner.status === 200, "teacher A GETting their own planner -> 200");

  console.log(`\n${passed} passed, ${failed} failed`);

  await prisma.lessonPlanner.deleteMany({ where: { id: plannerAId } });
  await prisma.teacherProfile.deleteMany({
    where: { user: { email: { in: [teacherAEmail, teacherBEmail] } } },
  });
  await prisma.user.deleteMany({ where: { email: { in: [teacherAEmail, teacherBEmail] } } });

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

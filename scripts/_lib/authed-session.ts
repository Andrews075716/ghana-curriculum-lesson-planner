/**
 * Shared HTTP helper for test scripts: a tiny cookie jar plus a
 * `loginAsDemoTeacher()` convenience, since every route now requires a
 * real authenticated session (see prisma/seed-data/demo-teacher.ts for
 * the fixture credentials).
 */
const BASE_URL = "http://localhost:3000";
const DEMO_EMAIL = "demo.teacher@example.edu.gh";
const DEMO_PASSWORD = "DemoTeacher123!";
const DEMO_ADMIN_EMAIL = "demo.admin@example.edu.gh";
const DEMO_ADMIN_PASSWORD = "DemoAdmin123!";

export class AuthedSession {
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

  async request(method: string, path: string, body?: unknown) {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(this.cookieHeader() ? { Cookie: this.cookieHeader() } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    this.capture(res);
    const json = await res.json().catch(() => null);
    return { status: res.status, body: json, headers: res.headers };
  }

  /** Like `request`, but returns the raw Response (for binary bodies like a PDF). */
  async requestRaw(method: string, path: string, body?: unknown) {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(this.cookieHeader() ? { Cookie: this.cookieHeader() } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    this.capture(res);
    return res;
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
  delete(path: string) {
    return this.request("DELETE", path);
  }

  toFetchCookieHeader(): string {
    return this.cookieHeader();
  }
}

export async function loginAsDemoTeacher(): Promise<AuthedSession> {
  const session = new AuthedSession();
  const res = await session.post("/api/auth/login", {
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
  });
  if (res.status !== 200) {
    throw new Error(
      `Failed to log in as the demo teacher (${res.status}): ${JSON.stringify(res.body)}. Did you re-run \`npx prisma db seed\` after the auth migration?`,
    );
  }
  return session;
}

export async function loginAsDemoAdmin(): Promise<AuthedSession> {
  const session = new AuthedSession();
  const res = await session.post("/api/auth/login", {
    email: DEMO_ADMIN_EMAIL,
    password: DEMO_ADMIN_PASSWORD,
  });
  if (res.status !== 200) {
    throw new Error(
      `Failed to log in as the demo admin (${res.status}): ${JSON.stringify(res.body)}. Did you re-run \`npx prisma db seed\` after adding the admin fixture?`,
    );
  }
  return session;
}

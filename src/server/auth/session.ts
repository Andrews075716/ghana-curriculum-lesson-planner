import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "@/server/db/prisma";
import { SESSION_COOKIE_NAME, SESSION_DURATION_MS } from "./auth.config";

/**
 * Session management: a signed (not encrypted — it carries no secret data,
 * just a user id) JWT in an httpOnly cookie, following the pattern Next.js
 * itself documents for stateless sessions
 * (https://nextjs.org/docs/app/guides/authentication#stateless-sessions).
 *
 * This is the Data Access Layer other code should use — `proxy.ts` only
 * does an optimistic cookie-presence redirect; every actual read/write of
 * teacher-owned data goes through `getCurrentTeacherId()` /
 * `verifySession()` here, which re-checks the signature and expiry on the
 * server, every time. "The UI hid the button" is never the only thing
 * standing between a request and someone else's data.
 */

interface SessionPayload extends Record<string, unknown> {
  userId: string;
}

function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "SESSION_SECRET is not set. Generate one with `openssl rand -base64 32` and add it to .env.",
    );
  }
  return new TextEncoder().encode(secret);
}

async function encrypt(payload: SessionPayload, expiresAt: Date): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(getSecretKey());
}

async function decrypt(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), { algorithms: ["HS256"] });
    if (typeof payload.userId !== "string") return null;
    return { userId: payload.userId };
  } catch {
    // Expired, malformed, or signed with a different/old secret — treat as signed-out.
    return null;
  }
}

export async function createSession(userId: string): Promise<void> {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  const token = await encrypt({ userId }, expiresAt);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/** Reads + verifies the session cookie. No redirect, no DB call — cheap, safe to call anywhere, memoized per request. */
export const getSessionPayload = cache(async (): Promise<SessionPayload | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return decrypt(token);
});

/** For Server Components that must be authenticated — redirects to /login otherwise. */
export async function verifySession(): Promise<{ userId: string }> {
  const session = await getSessionPayload();
  if (!session) {
    redirect("/login");
  }
  return { userId: session.userId };
}

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: "TEACHER" | "CURRICULUM_ADMIN";
  teacherProfileId: string | null;
}

/** Cached per-request. Returns null rather than redirecting — for optional-auth contexts (e.g. the header). */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await getSessionPayload();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      teacherProfile: { select: { id: true } },
    },
  });
  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    teacherProfileId: user.teacherProfile?.id ?? null,
  };
});

/**
 * Drop-in replacement for the old dev stand-in
 * (formerly `server/dev/current-teacher.ts`) — same signature
 * (`Promise<string | null>`), now backed by the real session. Every
 * service function that scopes a query by `teacherId` gets real,
 * per-request isolation from this for free. Returns null both when signed
 * out and when signed in without a teacher profile (e.g. an admin-only
 * account) — either way, there's no teacher-owned data to act on.
 */
export async function getCurrentTeacherId(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.teacherProfileId ?? null;
}

/** Throws if there's no authenticated user with a teacher profile — for service functions that must not proceed otherwise. */
export async function requireTeacherId(): Promise<string> {
  const teacherId = await getCurrentTeacherId();
  if (!teacherId) {
    throw new Error("No authenticated teacher.");
  }
  return teacherId;
}

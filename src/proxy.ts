import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { SESSION_COOKIE_NAME, AUTH_ONLY_ROUTES } from "@/server/auth/auth.config";

/**
 * Optimistic route protection only — this checks the session cookie's
 * signature and expiry (no database call, since Proxy runs on every
 * matched request including prefetches), then redirects. It is
 * deliberately NOT the real authorization boundary: every service
 * function that reads or writes teacher-owned data re-verifies the
 * session and re-resolves the teacher id itself
 * (`server/auth/session.ts`), so a Proxy matcher mistake here can never
 * by itself expose someone else's data. See the Next.js docs' own
 * warning: "Proxy... should not be used as a full session management or
 * authorization solution."
 *
 * This file intentionally does not import `server/auth/session.ts` (which
 * is guarded with `server-only` and assumes the app router's RSC module
 * graph) — Proxy is a separate entry point, so the JWT check is
 * self-contained here instead.
 */

const PROTECTED_PREFIXES = ["/dashboard", "/planners", "/curriculum", "/classes", "/resources", "/assessments", "/settings", "/admin"];

async function hasValidSession(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return false;

  const secret = process.env.SESSION_SECRET;
  if (!secret) return false;

  try {
    await jwtVerify(token, new TextEncoder().encode(secret), { algorithms: ["HS256"] });
    return true;
  } catch {
    return false;
  }
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authenticated = await hasValidSession(request);

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  const isAuthOnlyRoute = AUTH_ONLY_ROUTES.includes(pathname);

  if (isProtected && !authenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthOnlyRoute && authenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

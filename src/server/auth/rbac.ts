import "server-only";
import { redirect } from "next/navigation";
import { ForbiddenError } from "@/server/errors/app-error";
import { getCurrentUser, type CurrentUser } from "./session";

/** For admin-only Server Components (e.g. curriculum administration) — redirects everyone else. */
export async function requireAdmin(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (user.role !== "CURRICULUM_ADMIN") {
    redirect("/dashboard");
  }
  return user;
}

/**
 * For API routes and Server Actions — throws instead of redirecting, so
 * callers get a proper 403 JSON response via `handleRouteError`. Also
 * called directly by every mutating curriculum-admin service function
 * (not just the routes that front them) so a teacher account can never
 * modify curriculum data even if a future route forgets this check.
 */
export async function requireAdminSession(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new ForbiddenError("Authentication required.");
  }
  if (user.role !== "CURRICULUM_ADMIN") {
    throw new ForbiddenError("Admin access required.");
  }
  return user;
}

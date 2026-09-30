/** Shared constants for the auth system — session cookie and password-reset token lifetimes. */

export const SESSION_COOKIE_NAME = "session";
export const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export const PASSWORD_RESET_TOKEN_DURATION_MS = 60 * 60 * 1000; // 1 hour

/** Public routes reachable without a session; everything else under (app)/(admin) requires one. */
export const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];

/** Routes a signed-in user shouldn't linger on (redirected to /dashboard instead). */
export const AUTH_ONLY_ROUTES = ["/login", "/register", "/forgot-password", "/reset-password"];

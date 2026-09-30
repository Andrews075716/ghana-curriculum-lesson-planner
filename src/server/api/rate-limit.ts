import "server-only";
import { RateLimitedError } from "@/server/errors/app-error";

/**
 * In-memory sliding-window rate limiter for auth endpoints and other
 * abuse-prone/cost-sensitive routes (login, register, forgot-password, AI
 * actions). Deliberately dependency-free and process-local.
 *
 * IMPORTANT DEPLOYMENT CAVEAT: this state lives in a single Node process's
 * memory. It works correctly for a single long-running server instance
 * (e.g. `next start` on one machine/container), but NOT across multiple
 * instances or serverless invocations, where each one has its own memory
 * and the limit is effectively multiplied by instance count. If this app
 * is deployed to a multi-instance or serverless platform, replace this
 * with a shared store (e.g. Redis/Upstash) before relying on it.
 */

interface Bucket {
  count: number;
  windowStart: number;
}

const buckets = new Map<string, Bucket>();

// Bound memory growth from an unbounded stream of distinct keys (e.g. many
// IPs hammering the login endpoint) by dropping everything once the map
// gets implausibly large for this app's real traffic.
const MAX_BUCKETS = 50_000;

function checkRateLimit(key: string, limit: number, windowMs: number): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || now - existing.windowStart >= windowMs) {
    if (buckets.size >= MAX_BUCKETS) {
      buckets.clear();
    }
    buckets.set(key, { count: 1, windowStart: now });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (existing.count >= limit) {
    const retryAfterSeconds = Math.ceil((existing.windowStart + windowMs - now) / 1000);
    return { allowed: false, retryAfterSeconds: Math.max(retryAfterSeconds, 1) };
  }

  existing.count++;
  return { allowed: true, retryAfterSeconds: 0 };
}

/** Best-effort caller IP from standard proxy headers, falling back to a constant so unattributable requests still share one (conservative) bucket rather than bypassing the limiter entirely. */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

/**
 * Throws `RateLimitedError` if either the per-IP bucket or the (optional)
 * finer-grained per-key bucket is exhausted. The per-IP check catches
 * credential-stuffing sprays across many accounts from one source; the
 * per-key check catches repeated attempts against one account/action from
 * anywhere.
 */
export function enforceRateLimit(
  request: Request,
  routeName: string,
  options: {
    perIp: { limit: number; windowMs: number };
    perKey?: { key: string; limit: number; windowMs: number };
  },
): void {
  const ip = getClientIp(request);

  const ipResult = checkRateLimit(`${routeName}:ip:${ip}`, options.perIp.limit, options.perIp.windowMs);
  if (!ipResult.allowed) {
    throw new RateLimitedError(ipResult.retryAfterSeconds);
  }

  if (options.perKey) {
    const keyResult = checkRateLimit(
      `${routeName}:key:${options.perKey.key}`,
      options.perKey.limit,
      options.perKey.windowMs,
    );
    if (!keyResult.allowed) {
      throw new RateLimitedError(keyResult.retryAfterSeconds);
    }
  }
}

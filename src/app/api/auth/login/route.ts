import { NextResponse } from "next/server";
import { handleRouteError } from "@/server/errors/handle-route-error";
import { enforceRateLimit } from "@/server/api/rate-limit";
import { loginUser } from "@/server/services/auth.service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Coarse per-IP cap against credential stuffing across many accounts,
    // plus a tighter per-email cap against repeated guesses at one account.
    // bcrypt (cost 12) is the primary defense against brute force — this is
    // a secondary backstop against unlimited automated attempts, not tuned
    // to block a handful of genuine mistyped-password retries.
    enforceRateLimit(request, "login", {
      perIp: { limit: 60, windowMs: 5 * 60_000 },
      perKey:
        typeof body?.email === "string"
          ? { key: body.email.toLowerCase(), limit: 20, windowMs: 5 * 60_000 }
          : undefined,
    });
    await loginUser(body);
    return NextResponse.json({ data: { loggedIn: true } });
  } catch (error) {
    return handleRouteError(error);
  }
}

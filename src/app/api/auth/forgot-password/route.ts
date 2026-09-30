import { NextResponse } from "next/server";
import { handleRouteError } from "@/server/errors/handle-route-error";
import { enforceRateLimit } from "@/server/api/rate-limit";
import { requestPasswordReset } from "@/server/services/auth.service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Limits apply to the identifier regardless of whether the account
    // exists, so a 429 here never itself reveals account existence.
    enforceRateLimit(request, "forgot-password", {
      perIp: { limit: 20, windowMs: 60 * 60_000 },
      perKey:
        typeof body?.email === "string"
          ? { key: body.email.toLowerCase(), limit: 5, windowMs: 60 * 60_000 }
          : undefined,
    });
    const origin = new URL(request.url).origin;
    await requestPasswordReset(body, origin);
    // Always the same response, whether or not the email was registered.
    return NextResponse.json({
      data: { message: "If an account exists for that email, a reset link has been sent." },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

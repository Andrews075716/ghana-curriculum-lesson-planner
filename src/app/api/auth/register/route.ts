import { NextResponse } from "next/server";
import { handleRouteError } from "@/server/errors/handle-route-error";
import { enforceRateLimit } from "@/server/api/rate-limit";
import { registerTeacher } from "@/server/services/auth.service";

export async function POST(request: Request) {
  try {
    enforceRateLimit(request, "register", { perIp: { limit: 10, windowMs: 60 * 60_000 } });
    const body = await request.json();
    await registerTeacher(body);
    return NextResponse.json({ data: { registered: true } }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}

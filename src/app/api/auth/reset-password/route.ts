import { NextResponse } from "next/server";
import { handleRouteError } from "@/server/errors/handle-route-error";
import { resetPassword } from "@/server/services/auth.service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    await resetPassword(body);
    return NextResponse.json({ data: { reset: true } });
  } catch (error) {
    return handleRouteError(error);
  }
}

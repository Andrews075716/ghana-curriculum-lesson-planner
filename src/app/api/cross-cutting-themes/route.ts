import { NextResponse } from "next/server";
import { ForbiddenError } from "@/server/errors/app-error";
import { handleRouteError } from "@/server/errors/handle-route-error";
import { getCurrentTeacherId } from "@/server/auth/session";
import { listCrossCuttingThemes } from "@/server/repositories/reference-data.repository";

export async function GET() {
  try {
    if (!(await getCurrentTeacherId())) throw new ForbiddenError("Authentication required.");
    const data = await listCrossCuttingThemes();
    return NextResponse.json({ data });
  } catch (error) {
    return handleRouteError(error);
  }
}

import { NextResponse } from "next/server";
import { ForbiddenError } from "@/server/errors/app-error";
import { handleRouteError } from "@/server/errors/handle-route-error";
import { getCurrentUser } from "@/server/auth/session";
import { getTeacherProfileForUser, updateTeacherProfile } from "@/server/services/auth.service";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user?.teacherProfileId) throw new ForbiddenError("No teacher session available.");
    const profile = await getTeacherProfileForUser(user.teacherProfileId);
    return NextResponse.json({ data: profile });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user?.teacherProfileId) throw new ForbiddenError("No teacher session available.");
    const body = await request.json();
    await updateTeacherProfile(user.teacherProfileId, user.id, body);
    return NextResponse.json({ data: { saved: true } });
  } catch (error) {
    return handleRouteError(error);
  }
}

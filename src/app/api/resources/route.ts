import { NextResponse } from "next/server";
import { ForbiddenError } from "@/server/errors/app-error";
import { handleRouteError } from "@/server/errors/handle-route-error";
import { getCurrentTeacherId } from "@/server/auth/session";
import { createResourceForTeacher, getMyResources } from "@/server/services/resource.service";

export async function GET() {
  try {
    const teacherId = await getCurrentTeacherId();
    if (!teacherId) throw new ForbiddenError("No teacher session available.");
    const data = await getMyResources(teacherId);
    return NextResponse.json({ data });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const teacherId = await getCurrentTeacherId();
    if (!teacherId) throw new ForbiddenError("No teacher session available.");
    const body = await request.json();
    const id = await createResourceForTeacher(teacherId, body);
    return NextResponse.json({ data: { id } }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}

import { NextResponse } from "next/server";
import { ForbiddenError } from "@/server/errors/app-error";
import { handleRouteError } from "@/server/errors/handle-route-error";
import { getCurrentTeacherId } from "@/server/auth/session";
import { duplicatePlannerForTeacher } from "@/server/services/planner.service";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const teacherId = await getCurrentTeacherId();
    if (!teacherId) throw new ForbiddenError("No teacher session available.");
    const newId = await duplicatePlannerForTeacher(id, teacherId);
    return NextResponse.json({ data: { id: newId } }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}

import { NextResponse } from "next/server";
import { ForbiddenError } from "@/server/errors/app-error";
import { handleRouteError } from "@/server/errors/handle-route-error";
import { getCurrentTeacherId } from "@/server/auth/session";
import {
  getClassForTeacherOrThrow,
  updateClassForTeacher,
} from "@/server/services/class.service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const teacherId = await getCurrentTeacherId();
    if (!teacherId) throw new ForbiddenError("No teacher session available.");
    const data = await getClassForTeacherOrThrow(id, teacherId);
    return NextResponse.json({ data });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const teacherId = await getCurrentTeacherId();
    if (!teacherId) throw new ForbiddenError("No teacher session available.");
    const body = await request.json();
    await updateClassForTeacher(id, teacherId, body);
    return NextResponse.json({ data: { saved: true } });
  } catch (error) {
    return handleRouteError(error);
  }
}

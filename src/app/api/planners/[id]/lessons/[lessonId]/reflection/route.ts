import { NextResponse } from "next/server";
import { ForbiddenError } from "@/server/errors/app-error";
import { handleRouteError } from "@/server/errors/handle-route-error";
import { getCurrentTeacherId } from "@/server/auth/session";
import { getLessonDetailForTeacher, saveReflection } from "@/server/services/lesson.service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; lessonId: string }> },
) {
  const { id, lessonId } = await params;
  try {
    const teacherId = await getCurrentTeacherId();
    if (!teacherId) throw new ForbiddenError("No teacher session available.");
    const lesson = await getLessonDetailForTeacher(id, lessonId, teacherId);
    return NextResponse.json({ data: lesson });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; lessonId: string }> },
) {
  const { id, lessonId } = await params;
  try {
    const teacherId = await getCurrentTeacherId();
    if (!teacherId) throw new ForbiddenError("No teacher session available.");
    const body = await request.json();
    await saveReflection(id, lessonId, teacherId, body);
    return NextResponse.json({ data: { saved: true } });
  } catch (error) {
    return handleRouteError(error);
  }
}

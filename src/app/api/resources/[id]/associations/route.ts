import { NextResponse } from "next/server";
import { ForbiddenError } from "@/server/errors/app-error";
import { handleRouteError } from "@/server/errors/handle-route-error";
import { getCurrentTeacherId } from "@/server/auth/session";
import { setResourceAssociationForTeacher } from "@/server/services/resource.service";

/** Attaches or detaches this resource from a planner. Body: { plannerId, associated }. */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const teacherId = await getCurrentTeacherId();
    if (!teacherId) throw new ForbiddenError("No teacher session available.");
    const body = await request.json();
    await setResourceAssociationForTeacher(id, teacherId, body);
    return NextResponse.json({ data: { saved: true } });
  } catch (error) {
    return handleRouteError(error);
  }
}

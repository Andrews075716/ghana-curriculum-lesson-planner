import { NextRequest, NextResponse } from "next/server";
import { ForbiddenError } from "@/server/errors/app-error";
import { handleRouteError } from "@/server/errors/handle-route-error";
import { getCurrentTeacherId } from "@/server/auth/session";
import { getMyPlanners, startPlannerDraft } from "@/server/services/planner.service";

/** My Planners: search + filter by subject/class/term/status, sorted by most recently updated. */
export async function GET(request: NextRequest) {
  try {
    const teacherId = await getCurrentTeacherId();
    if (!teacherId) throw new ForbiddenError("No teacher session available.");

    const url = request.nextUrl;
    const query = {
      search: url.searchParams.get("search") ?? undefined,
      subjectId: url.searchParams.get("subjectId") ?? undefined,
      classLevelId: url.searchParams.get("classLevelId") ?? undefined,
      term: url.searchParams.get("term") ?? undefined,
      status: url.searchParams.get("status") ?? undefined,
    };
    const data = await getMyPlanners(teacherId, query);
    return NextResponse.json({ data });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST() {
  try {
    const teacherId = await getCurrentTeacherId();
    if (!teacherId) {
      throw new ForbiddenError("No teacher session available.");
    }
    const id = await startPlannerDraft(teacherId);
    return NextResponse.json({ data: { id } }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}

import { NextRequest, NextResponse } from "next/server";
import { ForbiddenError } from "@/server/errors/app-error";
import { handleRouteError } from "@/server/errors/handle-route-error";
import { getCurrentTeacherId } from "@/server/auth/session";
import { getMyAssessments } from "@/server/services/assessment.service";

/** Assessments across the teacher's planners, filterable by Subject/Class/Strand/Learning Indicator/DoK Level. */
export async function GET(request: NextRequest) {
  try {
    const teacherId = await getCurrentTeacherId();
    if (!teacherId) throw new ForbiddenError("No teacher session available.");

    const url = request.nextUrl;
    const query = {
      subjectId: url.searchParams.get("subjectId") ?? undefined,
      classLevelId: url.searchParams.get("classLevelId") ?? undefined,
      strandId: url.searchParams.get("strandId") ?? undefined,
      learningIndicatorId: url.searchParams.get("learningIndicatorId") ?? undefined,
      dokLevel: url.searchParams.get("dokLevel") ?? undefined,
    };
    const data = await getMyAssessments(teacherId, query);
    return NextResponse.json({ data });
  } catch (error) {
    return handleRouteError(error);
  }
}

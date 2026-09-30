import { NextRequest, NextResponse } from "next/server";
import { ForbiddenError } from "@/server/errors/app-error";
import { handleRouteError } from "@/server/errors/handle-route-error";
import { getCurrentTeacherId } from "@/server/auth/session";
import { parseQuery } from "@/server/api/parse-query";
import { ReflectableLessonsQuerySchema } from "@/lib/validation/lesson.schema";
import { getReflectableLessons } from "@/server/services/lesson.service";

/** Previous lessons (same subject + class) with reflection content — candidates for optional AI context. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const parsed = parseQuery(ReflectableLessonsQuerySchema, request.nextUrl.searchParams);
  if (!parsed.success) return parsed.response;

  try {
    const teacherId = await getCurrentTeacherId();
    if (!teacherId) throw new ForbiddenError("No teacher session available.");
    const data = await getReflectableLessons(
      teacherId,
      parsed.data.subjectId,
      parsed.data.classLevelId,
      id,
    );
    return NextResponse.json({ data });
  } catch (error) {
    return handleRouteError(error);
  }
}

import { NextRequest, NextResponse } from "next/server";
import { CurriculumSearchQuerySchema } from "@/lib/validation/curriculum.schema";
import { parseQuery } from "@/server/api/parse-query";
import { ForbiddenError } from "@/server/errors/app-error";
import { handleRouteError } from "@/server/errors/handle-route-error";
import { getCurrentTeacherId } from "@/server/auth/session";
import { searchCurriculum } from "@/server/services/curriculum.service";

/** Text search across one subject+classLevel's curriculum tree, for the Curriculum browser's search box. */
export async function GET(request: NextRequest) {
  const parsed = parseQuery(CurriculumSearchQuerySchema, request.nextUrl.searchParams);
  if (!parsed.success) return parsed.response;

  try {
    if (!(await getCurrentTeacherId())) throw new ForbiddenError("Authentication required.");
    const data = await searchCurriculum(parsed.data.subjectId, parsed.data.classLevelId, parsed.data.q);
    return NextResponse.json({ data });
  } catch (error) {
    return handleRouteError(error);
  }
}

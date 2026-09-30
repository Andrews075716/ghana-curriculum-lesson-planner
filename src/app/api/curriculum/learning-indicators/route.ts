import { NextRequest, NextResponse } from "next/server";
import { LearningIndicatorsQuerySchema } from "@/lib/validation/curriculum.schema";
import { parseQuery } from "@/server/api/parse-query";
import { ForbiddenError } from "@/server/errors/app-error";
import { handleRouteError } from "@/server/errors/handle-route-error";
import { getCurrentTeacherId } from "@/server/auth/session";
import { getLearningIndicators } from "@/server/services/curriculum.service";

export async function GET(request: NextRequest) {
  const parsed = parseQuery(LearningIndicatorsQuerySchema, request.nextUrl.searchParams);
  if (!parsed.success) return parsed.response;

  try {
    if (!(await getCurrentTeacherId())) throw new ForbiddenError("Authentication required.");
    const data = await getLearningIndicators(parsed.data.learningOutcomeId);
    return NextResponse.json({ data });
  } catch (error) {
    return handleRouteError(error);
  }
}

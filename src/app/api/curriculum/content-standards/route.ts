import { NextRequest, NextResponse } from "next/server";
import { ContentStandardsQuerySchema } from "@/lib/validation/curriculum.schema";
import { parseQuery } from "@/server/api/parse-query";
import { ForbiddenError } from "@/server/errors/app-error";
import { handleRouteError } from "@/server/errors/handle-route-error";
import { getCurrentTeacherId } from "@/server/auth/session";
import { getContentStandards } from "@/server/services/curriculum.service";

export async function GET(request: NextRequest) {
  const parsed = parseQuery(ContentStandardsQuerySchema, request.nextUrl.searchParams);
  if (!parsed.success) return parsed.response;

  try {
    if (!(await getCurrentTeacherId())) throw new ForbiddenError("Authentication required.");
    const data = await getContentStandards(parsed.data.subStrandId);
    return NextResponse.json({ data });
  } catch (error) {
    return handleRouteError(error);
  }
}

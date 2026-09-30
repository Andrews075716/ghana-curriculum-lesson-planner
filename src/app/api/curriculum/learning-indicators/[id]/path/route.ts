import { NextResponse } from "next/server";
import { ForbiddenError } from "@/server/errors/app-error";
import { handleRouteError } from "@/server/errors/handle-route-error";
import { getCurrentTeacherId } from "@/server/auth/session";
import { getLearningIndicatorPath } from "@/server/services/curriculum.service";

/**
 * Resolves a learning indicator's full ancestor chain (subject through
 * indicator), used to hydrate the curriculum selector when editing an
 * existing planner.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    if (!(await getCurrentTeacherId())) throw new ForbiddenError("Authentication required.");
    const data = await getLearningIndicatorPath(id);
    return NextResponse.json({ data });
  } catch (error) {
    return handleRouteError(error);
  }
}

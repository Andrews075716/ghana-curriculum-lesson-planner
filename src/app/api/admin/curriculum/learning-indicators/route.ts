import { NextResponse } from "next/server";
import { ValidationError } from "@/server/errors/app-error";
import { handleRouteError } from "@/server/errors/handle-route-error";
import {
  listLearningIndicatorsAdmin,
  createLearningIndicatorAdmin,
} from "@/server/services/curriculum-admin.service";

export async function GET(request: Request) {
  try {
    const learningOutcomeId = new URL(request.url).searchParams.get("learningOutcomeId");
    if (!learningOutcomeId) throw new ValidationError("learningOutcomeId query parameter is required.");
    const data = await listLearningIndicatorsAdmin(learningOutcomeId);
    return NextResponse.json({ data });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = await createLearningIndicatorAdmin(body);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}

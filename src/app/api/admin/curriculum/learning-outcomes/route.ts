import { NextResponse } from "next/server";
import { ValidationError } from "@/server/errors/app-error";
import { handleRouteError } from "@/server/errors/handle-route-error";
import {
  listLearningOutcomesAdmin,
  createLearningOutcomeAdmin,
} from "@/server/services/curriculum-admin.service";

export async function GET(request: Request) {
  try {
    const contentStandardId = new URL(request.url).searchParams.get("contentStandardId");
    if (!contentStandardId) throw new ValidationError("contentStandardId query parameter is required.");
    const data = await listLearningOutcomesAdmin(contentStandardId);
    return NextResponse.json({ data });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = await createLearningOutcomeAdmin(body);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}

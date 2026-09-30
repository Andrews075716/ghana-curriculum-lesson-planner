import { NextResponse } from "next/server";
import { ValidationError } from "@/server/errors/app-error";
import { handleRouteError } from "@/server/errors/handle-route-error";
import {
  listContentStandardsAdmin,
  createContentStandardAdmin,
} from "@/server/services/curriculum-admin.service";

export async function GET(request: Request) {
  try {
    const subStrandId = new URL(request.url).searchParams.get("subStrandId");
    if (!subStrandId) throw new ValidationError("subStrandId query parameter is required.");
    const data = await listContentStandardsAdmin(subStrandId);
    return NextResponse.json({ data });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = await createContentStandardAdmin(body);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}

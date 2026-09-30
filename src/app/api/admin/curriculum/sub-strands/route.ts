import { NextResponse } from "next/server";
import { ValidationError } from "@/server/errors/app-error";
import { handleRouteError } from "@/server/errors/handle-route-error";
import { listSubStrandsAdmin, createSubStrandAdmin } from "@/server/services/curriculum-admin.service";

export async function GET(request: Request) {
  try {
    const strandId = new URL(request.url).searchParams.get("strandId");
    if (!strandId) throw new ValidationError("strandId query parameter is required.");
    const data = await listSubStrandsAdmin(strandId);
    return NextResponse.json({ data });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = await createSubStrandAdmin(body);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}

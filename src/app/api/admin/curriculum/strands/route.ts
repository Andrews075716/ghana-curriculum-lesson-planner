import { NextResponse } from "next/server";
import { handleRouteError } from "@/server/errors/handle-route-error";
import { listStrandsAdmin, createStrandAdmin } from "@/server/services/curriculum-admin.service";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const data = await listStrandsAdmin({
      subjectId: url.searchParams.get("subjectId") ?? undefined,
      classLevelId: url.searchParams.get("classLevelId") ?? undefined,
      curriculumVersionId: url.searchParams.get("curriculumVersionId") ?? undefined,
    });
    return NextResponse.json({ data });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = await createStrandAdmin(body);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}

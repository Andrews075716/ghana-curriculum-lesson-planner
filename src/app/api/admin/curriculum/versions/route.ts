import { NextResponse } from "next/server";
import { handleRouteError } from "@/server/errors/handle-route-error";
import {
  listCurriculumVersionsAdmin,
  createCurriculumVersionAdmin,
} from "@/server/services/curriculum-admin.service";

export async function GET() {
  try {
    const data = await listCurriculumVersionsAdmin();
    return NextResponse.json({ data });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = await createCurriculumVersionAdmin(body);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}

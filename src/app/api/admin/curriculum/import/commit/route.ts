import { NextResponse } from "next/server";
import { handleRouteError } from "@/server/errors/handle-route-error";
import { commitCurriculumImportAdmin } from "@/server/services/curriculum-admin.service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = await commitCurriculumImportAdmin(body?.format, body?.content);
    return NextResponse.json({ data });
  } catch (error) {
    return handleRouteError(error);
  }
}

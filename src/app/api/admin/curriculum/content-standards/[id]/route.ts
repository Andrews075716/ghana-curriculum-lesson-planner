import { NextResponse } from "next/server";
import { handleRouteError } from "@/server/errors/handle-route-error";
import {
  updateContentStandardAdmin,
  deleteContentStandardAdmin,
} from "@/server/services/curriculum-admin.service";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const data = await updateContentStandardAdmin(id, body);
    return NextResponse.json({ data });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await deleteContentStandardAdmin(id);
    return NextResponse.json({ data: { deleted: true } });
  } catch (error) {
    return handleRouteError(error);
  }
}

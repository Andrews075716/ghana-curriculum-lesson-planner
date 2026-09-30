import { NextResponse } from "next/server";
import { handleRouteError } from "@/server/errors/handle-route-error";
import { logoutUser } from "@/server/services/auth.service";

export async function POST() {
  try {
    await logoutUser();
    return NextResponse.json({ data: { loggedOut: true } });
  } catch (error) {
    return handleRouteError(error);
  }
}

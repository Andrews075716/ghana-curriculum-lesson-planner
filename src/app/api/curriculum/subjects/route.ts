import { NextResponse } from "next/server";
import { handleRouteError } from "@/server/errors/handle-route-error";
import { getSubjects } from "@/server/services/curriculum.service";

/**
 * Deliberately public (no session check): the registration form's subject
 * picker calls this before the visitor has an account. The data itself is
 * non-sensitive published curriculum metadata. Every other curriculum
 * reference-data route requires a session — this and class-levels/all are
 * the only two intentional exceptions.
 */
export async function GET() {
  try {
    const data = await getSubjects();
    return NextResponse.json({ data });
  } catch (error) {
    return handleRouteError(error);
  }
}

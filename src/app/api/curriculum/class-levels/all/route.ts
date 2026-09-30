import { NextResponse } from "next/server";
import { handleRouteError } from "@/server/errors/handle-route-error";
import { getAllClassLevels } from "@/server/services/curriculum.service";

/**
 * Unfiltered class-level list — for the registration/profile forms, not
 * the curriculum-alignment cascade. Deliberately public (no session
 * check): the registration form calls this before the visitor has an
 * account. See src/app/api/curriculum/subjects/route.ts for the same note.
 */
export async function GET() {
  try {
    const data = await getAllClassLevels();
    return NextResponse.json({ data });
  } catch (error) {
    return handleRouteError(error);
  }
}

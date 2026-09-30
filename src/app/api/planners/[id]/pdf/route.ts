import { NextResponse } from "next/server";
import { ForbiddenError } from "@/server/errors/app-error";
import { handleRouteError } from "@/server/errors/handle-route-error";
import { getCurrentTeacherId } from "@/server/auth/session";
import { getPlannerPrintViewForTeacher } from "@/server/services/planner.service";
import { renderPlannerPdf } from "@/server/pdf/render-planner-pdf";
import type { PlannerPrintView } from "@/server/repositories/planner.repository";

function buildFilename(view: PlannerPrintView): string {
  const parts = [
    "Lesson-Plan",
    view.subject,
    view.form,
    view.weekNumber ? `Week-${view.weekNumber}` : null,
  ].filter((part): part is string => Boolean(part));
  const slug = parts
    .join("-")
    .replace(/[^a-zA-Z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return `${slug || "Lesson-Plan"}.pdf`;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const teacherId = await getCurrentTeacherId();
    if (!teacherId) throw new ForbiddenError("No teacher session available.");

    // Confirms the planner exists and belongs to this teacher before
    // spending time on a headless-browser render, and supplies the data
    // for a readable download filename.
    const view = await getPlannerPrintViewForTeacher(id, teacherId);

    const origin = new URL(request.url).origin;
    const pdfBuffer = await renderPlannerPdf(
      `${origin}/planners/${id}/print`,
      request.headers.get("cookie") ?? "",
    );

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${buildFilename(view)}"`,
        "Content-Length": String(pdfBuffer.length),
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

import { notFound } from "next/navigation";
import { getCurrentTeacherId } from "@/server/auth/session";
import { getPlannerPrintViewForTeacher } from "@/server/services/planner.service";
import { NotFoundError } from "@/server/errors/app-error";
import { PlannerPrintDocument } from "@/components/planner/print/PlannerPrintDocument";
import { PrintActions } from "@/components/planner/print/PrintActions";

export const dynamic = "force-dynamic";

export default async function PlannerPrintPage({
  params,
}: {
  params: Promise<{ plannerId: string }>;
}) {
  const { plannerId } = await params;
  const teacherId = await getCurrentTeacherId();

  if (!teacherId) {
    return (
      <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
        Your account doesn&apos;t have a teacher profile, so there&apos;s nothing to preview yet.
        Contact an administrator if you believe this is a mistake.
      </div>
    );
  }

  let data;
  try {
    data = await getPlannerPrintViewForTeacher(plannerId, teacherId);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  return (
    <div>
      <PrintActions plannerId={plannerId} />
      <PlannerPrintDocument data={data} />
    </div>
  );
}

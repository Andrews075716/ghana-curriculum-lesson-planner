import { notFound } from "next/navigation";
import { getCurrentTeacherId } from "@/server/auth/session";
import { getPlannerPrintViewForTeacher } from "@/server/services/planner.service";
import { NotFoundError } from "@/server/errors/app-error";
import { PlannerPrintDocument } from "@/components/planner/print/PlannerPrintDocument";
import { PlannerDetailActions } from "@/components/planner/detail/PlannerDetailActions";

export const dynamic = "force-dynamic";

export default async function PlannerDetailPage({
  params,
}: {
  params: Promise<{ plannerId: string }>;
}) {
  const { plannerId } = await params;
  const teacherId = await getCurrentTeacherId();

  if (!teacherId) {
    return (
      <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
        Your account doesn&apos;t have a teacher profile, so there&apos;s nothing to view yet.
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
      <PlannerDetailActions
        plannerId={plannerId}
        status={data.status}
        topic={data.learningIndicator ?? "Untitled lesson"}
      />
      <div className="overflow-hidden rounded-xl border bg-card p-6">
        <PlannerPrintDocument data={data} />
      </div>
    </div>
  );
}

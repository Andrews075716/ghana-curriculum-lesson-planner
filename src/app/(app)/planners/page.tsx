import { getCurrentTeacherId } from "@/server/auth/session";
import { MyPlannersView } from "@/components/planner/list/MyPlannersView";

export const dynamic = "force-dynamic";

export default async function PlannersListPage() {
  const teacherId = await getCurrentTeacherId();

  if (!teacherId) {
    return (
      <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
        Your account doesn&apos;t have a teacher profile, so there&apos;s nothing to show here.
        Contact an administrator if you believe this is a mistake.
      </div>
    );
  }

  return <MyPlannersView />;
}

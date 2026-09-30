import Link from "next/link";
import { Plus, Library, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { RecentPlanners } from "@/components/dashboard/RecentPlanners";
import { UpcomingLessons } from "@/components/dashboard/UpcomingLessons";
import { getCurrentTeacherId, getCurrentUser } from "@/server/auth/session";
import { getDashboardOverview } from "@/server/services/planner.service";

// This page reads live data (planner counts, recent activity) on every
// request rather than being frozen at build time.
export const dynamic = "force-dynamic";

const QUICK_ACTIONS = [
  {
    label: "View Curriculum",
    description: "Find a strand, sub-strand or indicator to plan from.",
    href: "/curriculum",
    icon: Library,
  },
  {
    label: "View My Planners",
    description: "See all the planners you've created.",
    href: "/planners",
    icon: Users,
  },
];

export default async function DashboardPage() {
  const [teacherId, user] = await Promise.all([getCurrentTeacherId(), getCurrentUser()]);
  const overview = await getDashboardOverview(teacherId);
  const firstName = user?.name.split(" ")[0] ?? "there";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            Welcome back, {firstName}
          </h1>
          <p className="text-sm text-muted-foreground">
            Here&apos;s an overview of your lesson planning.
          </p>
        </div>
        <Button render={<Link href="/planners/new" />} nativeButton={false}>
          <Plus className="size-4" />
          Create New Planner
        </Button>
      </div>

      <DashboardStats stats={overview.stats} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <RecentPlanners planners={overview.recentPlanners} />
          <UpcomingLessons lessons={overview.upcomingLessons} />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            <Link
              href="/planners/new"
              className="flex items-start gap-3 rounded-md p-2 -mx-2 transition-colors hover:bg-muted"
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Plus className="size-4" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  Create New Planner
                </p>
                <p className="text-xs text-muted-foreground">
                  Start a new lesson planner from a curriculum indicator.
                </p>
              </div>
            </Link>
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="flex items-start gap-3 rounded-md p-2 -mx-2 transition-colors hover:bg-muted"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <action.icon className="size-4" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {action.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {action.description}
                  </p>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

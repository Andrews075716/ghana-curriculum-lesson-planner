import { BookOpen, CalendarRange, NotebookPen, Users, Library } from "lucide-react";
import { StatCard } from "./StatCard";
import type { DashboardStats as DashboardStatsData } from "@/server/services/planner.service";

export function DashboardStats({ stats }: { stats: DashboardStatsData }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <StatCard
        label="Total Planners"
        value={String(stats.totalPlanners)}
        icon={BookOpen}
      />
      <StatCard
        label="Draft Planners"
        value={String(stats.draftPlanners)}
        icon={NotebookPen}
      />
      <StatCard
        label="Planners This Term"
        value={String(stats.plannersThisTerm)}
        icon={CalendarRange}
      />
      <StatCard label="Classes" value={String(stats.classes)} icon={Users} />
      <StatCard
        label="Subjects"
        value={String(stats.subjects)}
        icon={Library}
      />
    </div>
  );
}

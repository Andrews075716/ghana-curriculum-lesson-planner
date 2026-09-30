import { CalendarClock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "./EmptyState";
import { formatTerm } from "@/lib/format";
import type { UpcomingLessonRow } from "@/server/repositories/planner.repository";

export function UpcomingLessons({ lessons }: { lessons: UpcomingLessonRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Lessons</CardTitle>
      </CardHeader>
      <CardContent>
        {lessons.length === 0 ? (
          <EmptyState
            icon={CalendarClock}
            title="No upcoming lessons"
            description="Lessons from your planners will appear here as you schedule them."
          />
        ) : (
          <ul className="flex flex-col divide-y">
            {lessons.map((lesson) => (
              <li
                key={lesson.id}
                className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {lesson.name} &mdash; {lesson.planner.curriculum.subjectName}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {lesson.planner.curriculum.strandName}
                  </p>
                </div>
                <div className="shrink-0 text-right text-xs text-muted-foreground">
                  <p>{lesson.planner.classSection}</p>
                  <p>
                    {formatTerm(lesson.planner.term)}, Week{" "}
                    {lesson.planner.weekNumber}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

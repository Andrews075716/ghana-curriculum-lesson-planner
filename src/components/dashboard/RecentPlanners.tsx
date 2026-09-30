import Link from "next/link";
import { ArrowUpRight, NotebookPen, NotebookText, Printer } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "./EmptyState";
import { formatRelativeTime } from "@/lib/format";
import type { RecentPlannerRow } from "@/server/repositories/planner.repository";

const STATUS_LABEL: Record<RecentPlannerRow["status"], string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
};

function StatusBadge({ status }: { status: RecentPlannerRow["status"] }) {
  return (
    <Badge variant={status === "PUBLISHED" ? "default" : "secondary"}>
      {STATUS_LABEL[status]}
    </Badge>
  );
}

function SubjectLabel({ planner }: { planner: RecentPlannerRow }) {
  if (planner.status === "DRAFT") {
    return (
      <Link
        href={`/planners/new?draftId=${planner.id}`}
        className="hover:underline"
      >
        {planner.curriculum.subjectName}
      </Link>
    );
  }
  return <>{planner.curriculum.subjectName}</>;
}

export function RecentPlanners({ planners }: { planners: RecentPlannerRow[] }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Recent Planners</CardTitle>
        <CardAction>
          <Button variant="ghost" size="sm" render={<Link href="/planners" />} nativeButton={false}>
            View all
            <ArrowUpRight className="size-4" />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {planners.length === 0 ? (
          <EmptyState
            icon={NotebookPen}
            title="No planners yet"
            description="Create your first lesson planner to see it here."
            actionLabel="Create Planner"
            actionHref="/planners/new"
          />
        ) : (
          <>
            {/* Table layout: sm and up */}
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">Subject</th>
                    <th className="py-2 pr-3 font-medium">Class</th>
                    <th className="py-2 pr-3 font-medium">Week</th>
                    <th className="py-2 pr-3 font-medium">Strand</th>
                    <th className="py-2 pr-3 font-medium">Status</th>
                    <th className="py-2 pr-3 text-right font-medium">Last Modified</th>
                    <th className="py-2 pl-3 text-right font-medium">
                      <span className="sr-only">Preview</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {planners.map((planner) => (
                    <tr key={planner.id} className="border-b last:border-0">
                      <td className="py-2.5 pr-3 font-medium text-foreground">
                        <SubjectLabel planner={planner} />
                      </td>
                      <td className="py-2.5 pr-3 text-muted-foreground">
                        {planner.classSection ?? "—"}
                      </td>
                      <td className="py-2.5 pr-3 text-muted-foreground">
                        {planner.weekNumber ? `Week ${planner.weekNumber}` : "—"}
                      </td>
                      <td className="py-2.5 pr-3 max-w-48 truncate text-muted-foreground">
                        {planner.curriculum.strandName}
                      </td>
                      <td className="py-2.5 pr-3">
                        <StatusBadge status={planner.status} />
                      </td>
                      <td className="py-2.5 pr-3 text-right text-xs text-muted-foreground">
                        {formatRelativeTime(planner.updatedAt)}
                      </td>
                      <td className="py-2.5 pl-3 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <Link
                            href={`/planners/${planner.id}/print`}
                            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline"
                          >
                            <Printer className="size-3.5" />
                            Preview
                          </Link>
                          {planner.lessonId ? (
                            <Link
                              href={`/planners/${planner.id}/lessons/${planner.lessonId}`}
                              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline"
                            >
                              <NotebookText className="size-3.5" />
                              Reflect
                            </Link>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Card layout: below sm */}
            <div className="flex flex-col divide-y sm:hidden">
              {planners.map((planner) => (
                <div key={planner.id} className="flex flex-col gap-1.5 py-3 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-foreground">
                      <SubjectLabel planner={planner} />
                    </p>
                    <StatusBadge status={planner.status} />
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {planner.curriculum.strandName}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {planner.classSection ?? "—"} &middot;{" "}
                      {planner.weekNumber ? `Week ${planner.weekNumber}` : "—"} &middot;{" "}
                      {formatRelativeTime(planner.updatedAt)}
                    </span>
                    <span className="flex items-center gap-3">
                      <Link
                        href={`/planners/${planner.id}/print`}
                        className="inline-flex items-center gap-1 hover:text-foreground hover:underline"
                      >
                        <Printer className="size-3.5" />
                        Preview
                      </Link>
                      {planner.lessonId ? (
                        <Link
                          href={`/planners/${planner.id}/lessons/${planner.lessonId}`}
                          className="inline-flex items-center gap-1 hover:text-foreground hover:underline"
                        >
                          <NotebookText className="size-3.5" />
                          Reflect
                        </Link>
                      ) : null}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

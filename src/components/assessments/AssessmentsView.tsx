"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, ClipboardList, SearchX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { useCurriculumOptions } from "@/hooks/useCurriculumOptions";
import { DOK_LEVEL_OPTIONS } from "@/lib/constants/planner-wizard";

interface AssessmentRowDto {
  id: string;
  dokLevel: "LEVEL_1" | "LEVEL_2" | "LEVEL_3" | "LEVEL_4";
  description: string;
  plannerId: string;
  plannerTopic: string;
  classSection: string | null;
  lessonId: string | null;
  lessonName: string | null;
  subjectId: string | null;
  subjectName: string;
  classLevelId: string | null;
  strandId: string | null;
  strandName: string;
  learningIndicatorId: string | null;
  learningIndicatorLabel: string;
}

const ALL_VALUE = "__all__";

const DOK_LABEL: Record<AssessmentRowDto["dokLevel"], string> = Object.fromEntries(
  DOK_LEVEL_OPTIONS.map((o) => [o.value, o.label]),
) as Record<AssessmentRowDto["dokLevel"], string>;

function buildQuery(filters: {
  subjectId: string;
  classLevelId: string;
  strandId: string;
  learningIndicatorId: string;
  dokLevel: string;
}): string {
  const params = new URLSearchParams();
  if (filters.subjectId !== ALL_VALUE) params.set("subjectId", filters.subjectId);
  if (filters.classLevelId !== ALL_VALUE) params.set("classLevelId", filters.classLevelId);
  if (filters.strandId !== ALL_VALUE) params.set("strandId", filters.strandId);
  if (filters.learningIndicatorId !== ALL_VALUE) params.set("learningIndicatorId", filters.learningIndicatorId);
  if (filters.dokLevel !== ALL_VALUE) params.set("dokLevel", filters.dokLevel);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

function dedupe<T>(items: T[], keyOf: (t: T) => string | null): { id: string; label: string }[] {
  const map = new Map<string, string>();
  for (const item of items) {
    const key = keyOf(item);
    if (key) map.set(key, key);
  }
  return [...map.keys()].map((id) => ({ id, label: id }));
}

export function AssessmentsView() {
  const [subjectId, setSubjectId] = useState(ALL_VALUE);
  const [classLevelId, setClassLevelId] = useState(ALL_VALUE);
  const [strandId, setStrandId] = useState(ALL_VALUE);
  const [learningIndicatorId, setLearningIndicatorId] = useState(ALL_VALUE);
  const [dokLevel, setDokLevel] = useState(ALL_VALUE);

  const subjects = useCurriculumOptions("/api/curriculum/subjects");
  const classLevels = useCurriculumOptions("/api/curriculum/class-levels/all");

  const [allRows, setAllRows] = useState<AssessmentRowDto[] | null>(null);
  const [rows, setRows] = useState<AssessmentRowDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  const loading = rows === null && error === null;

  // Unfiltered fetch once, purely to derive Strand / Learning Indicator filter options
  // from assessments that actually exist (no unscoped "list all strands" endpoint exists).
  useEffect(() => {
    fetch("/api/assessments")
      .then((r) => r.json())
      .then((body) => setAllRows((body?.data ?? []) as AssessmentRowDto[]))
      .catch(() => setAllRows([]));
  }, [refreshToken]);

  const query = useMemo(
    () => buildQuery({ subjectId, classLevelId, strandId, learningIndicatorId, dokLevel }),
    [subjectId, classLevelId, strandId, learningIndicatorId, dokLevel],
  );

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/assessments${query}`)
      .then(async (res) => {
        const body = await res.json().catch(() => null);
        if (!res.ok) throw new Error(body?.error?.message ?? "Failed to load assessments.");
        return body.data as AssessmentRowDto[];
      })
      .then((data) => {
        if (cancelled) return;
        setRows(data);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load assessments.");
      });
    return () => {
      cancelled = true;
    };
  }, [query, refreshToken]);

  function refresh() {
    setRefreshToken((t) => t + 1);
  }

  const strandNameById = new Map((allRows ?? []).map((r) => [r.strandId, r.strandName]));
  const strandOptions = dedupe(allRows ?? [], (r) => r.strandId).map((o) => ({
    id: o.id,
    label: strandNameById.get(o.id) ?? o.id,
  }));

  const indicatorLabelById = new Map((allRows ?? []).map((r) => [r.learningIndicatorId, r.learningIndicatorLabel]));
  const indicatorScope =
    strandId === ALL_VALUE ? (allRows ?? []) : (allRows ?? []).filter((r) => r.strandId === strandId);
  const indicatorOptions = dedupe(indicatorScope, (r) => r.learningIndicatorId).map((o) => ({
    id: o.id,
    label: indicatorLabelById.get(o.id) ?? o.id,
  }));

  const filtersActive =
    subjectId !== ALL_VALUE ||
    classLevelId !== ALL_VALUE ||
    strandId !== ALL_VALUE ||
    learningIndicatorId !== ALL_VALUE ||
    dokLevel !== ALL_VALUE;

  function clearFilters() {
    setSubjectId(ALL_VALUE);
    setClassLevelId(ALL_VALUE);
    setStrandId(ALL_VALUE);
    setLearningIndicatorId(ALL_VALUE);
    setDokLevel(ALL_VALUE);
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Assessments</h1>
        <p className="text-sm text-muted-foreground">
          Every assessment item created across your lesson planners, in one place.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <Select value={subjectId} onValueChange={(v) => setSubjectId(v as string)}>
          <SelectTrigger aria-label="Filter by subject" className="sm:w-40">
            <SelectValue placeholder="Subject">
              {(v: string) =>
                v === ALL_VALUE ? "All subjects" : (subjects.options.find((s) => s.id === v)?.label ?? v)
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>All subjects</SelectItem>
            {subjects.options.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={classLevelId} onValueChange={(v) => setClassLevelId(v as string)}>
          <SelectTrigger aria-label="Filter by class or form" className="sm:w-36">
            <SelectValue placeholder="Class / Form">
              {(v: string) =>
                v === ALL_VALUE ? "All classes" : (classLevels.options.find((c) => c.id === v)?.label ?? v)
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>All classes</SelectItem>
            {classLevels.options.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={strandId}
          onValueChange={(v) => {
            setStrandId(v as string);
            setLearningIndicatorId(ALL_VALUE);
          }}
        >
          <SelectTrigger aria-label="Filter by strand" className="sm:w-48">
            <SelectValue placeholder="Strand">
              {(v: string) => (v === ALL_VALUE ? "All strands" : (strandOptions.find((s) => s.id === v)?.label ?? v))}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>All strands</SelectItem>
            {strandOptions.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={learningIndicatorId} onValueChange={(v) => setLearningIndicatorId(v as string)}>
          <SelectTrigger aria-label="Filter by learning indicator" className="sm:w-56">
            <SelectValue placeholder="Learning Indicator">
              {(v: string) =>
                v === ALL_VALUE ? "All learning indicators" : (indicatorOptions.find((i) => i.id === v)?.label ?? v)
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>All learning indicators</SelectItem>
            {indicatorOptions.map((i) => (
              <SelectItem key={i.id} value={i.id}>
                {i.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={dokLevel} onValueChange={(v) => setDokLevel(v as string)}>
          <SelectTrigger aria-label="Filter by DoK level" className="sm:w-36">
            <SelectValue placeholder="DoK Level">
              {(v: string) => (v === ALL_VALUE ? "All DoK levels" : DOK_LABEL[v as AssessmentRowDto["dokLevel"]])}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>All DoK levels</SelectItem>
            {DOK_LEVEL_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {filtersActive ? (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear filters
          </Button>
        ) : null}
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>
            {error}{" "}
            <button type="button" onClick={refresh} className="font-medium underline underline-offset-2">
              Try again
            </button>
          </AlertDescription>
        </Alert>
      ) : !rows || rows.length === 0 ? (
        filtersActive ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <SearchX className="size-5" aria-hidden="true" />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-foreground">No assessments match your filters</p>
              <p className="text-sm text-muted-foreground">Try clearing a filter to see more results.</p>
            </div>
            <Button size="sm" variant="outline" onClick={clearFilters}>
              Clear filters
            </Button>
          </div>
        ) : (
          <EmptyState
            icon={ClipboardList}
            title="No assessments yet"
            description="Assessments you add while creating a lesson planner will show up here."
            actionLabel="Create Planner"
            actionHref="/planners/new"
          />
        )
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((row) => (
            <div key={row.id} className="rounded-xl border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium text-foreground">{row.description}</p>
                <Badge variant="secondary">{DOK_LABEL[row.dokLevel]}</Badge>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                {row.subjectName} &middot; {row.strandName} &middot; {row.learningIndicatorLabel}
              </p>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>{row.lessonName ?? "No lesson yet"}</span>
                <Link href={`/planners/${row.plannerId}`} className="hover:text-foreground hover:underline">
                  {row.plannerTopic}
                  {row.classSection ? ` (${row.classSection})` : ""}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Copy,
  Eye,
  NotebookPen,
  Pencil,
  Printer,
  SearchX,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { formatRelativeTime, formatTerm } from "@/lib/format";
import { cn } from "@/lib/utils";
import { TERM_OPTIONS } from "@/lib/constants/planner-wizard";

interface PlannerListRowDto {
  id: string;
  lessonId: string | null;
  lessonDate: string | null;
  classSection: string | null;
  term: "TERM_1" | "TERM_2" | "TERM_3" | null;
  weekNumber: number | null;
  durationMinutes: number | null;
  status: "DRAFT" | "PUBLISHED";
  updatedAt: string;
  topic: string;
  curriculum: { subjectName: string; strandName: string };
  subStrandName: string | null;
}

interface CurriculumOption {
  id: string;
  label: string;
}

const ALL_VALUE = "__all__";

const STATUS_LABEL: Record<PlannerListRowDto["status"], string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
};

function StatusBadge({ status }: { status: PlannerListRowDto["status"] }) {
  return (
    <Badge variant={status === "PUBLISHED" ? "default" : "secondary"}>
      {STATUS_LABEL[status]}
    </Badge>
  );
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function buildQuery(filters: {
  search: string;
  subjectId: string;
  classLevelId: string;
  term: string;
  status: string;
}): string {
  const params = new URLSearchParams();
  if (filters.search.trim()) params.set("search", filters.search.trim());
  if (filters.subjectId !== ALL_VALUE) params.set("subjectId", filters.subjectId);
  if (filters.classLevelId !== ALL_VALUE) params.set("classLevelId", filters.classLevelId);
  if (filters.term !== ALL_VALUE) params.set("term", filters.term);
  if (filters.status !== ALL_VALUE) params.set("status", filters.status);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

function RowSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-5 w-16" />
      </div>
      <Skeleton className="mt-3 h-4 w-full max-w-md" />
      <Skeleton className="mt-2 h-4 w-1/2" />
    </div>
  );
}

function DeleteRowDialog({
  planner,
  onConfirm,
}: {
  planner: PlannerListRowDto;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Delete ${planner.topic}`}
          />
        }
      >
        <Trash2 className="size-3.5 text-destructive" />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this planner?</AlertDialogTitle>
          <AlertDialogDescription>
            &ldquo;{planner.topic}&rdquo;
            {planner.classSection ? ` (${planner.classSection})` : ""} will be permanently
            deleted, including its lesson activities and assessments. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirm}>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function PlannerRow({
  planner,
  onDelete,
  onDuplicate,
  busy,
}: {
  planner: PlannerListRowDto;
  onDelete: () => void;
  onDuplicate: () => void;
  busy: boolean;
}) {
  const editHref =
    planner.status === "DRAFT"
      ? `/planners/new?draftId=${planner.id}`
      : `/planners/${planner.id}`;

  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-4 transition-opacity",
        busy && "pointer-events-none opacity-60",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <Link
          href={`/planners/${planner.id}`}
          className="font-medium text-foreground hover:underline"
        >
          {planner.topic}
        </Link>
        <StatusBadge status={planner.status} />
      </div>

      <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted-foreground">
        <span>{planner.curriculum.subjectName}</span>
        <span aria-hidden="true">&middot;</span>
        <span>{planner.classSection ?? "No class set"}</span>
        {planner.term ? (
          <>
            <span aria-hidden="true">&middot;</span>
            <span>{formatTerm(planner.term)}</span>
          </>
        ) : null}
        {planner.weekNumber ? (
          <>
            <span aria-hidden="true">&middot;</span>
            <span>Week {planner.weekNumber}</span>
          </>
        ) : null}
        <span aria-hidden="true">&middot;</span>
        <span className="max-w-56 truncate">{planner.curriculum.strandName}</span>
        {planner.subStrandName ? (
          <>
            <span aria-hidden="true">&middot;</span>
            <span className="max-w-56 truncate">{planner.subStrandName}</span>
          </>
        ) : null}
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>{formatDate(planner.lessonDate)}</span>
          {planner.durationMinutes ? <span>{planner.durationMinutes} min</span> : null}
          <span>Updated {formatRelativeTime(new Date(planner.updatedAt))}</span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`View ${planner.topic}`}
            render={<Link href={`/planners/${planner.id}`} />}
            nativeButton={false}
          >
            <Eye className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Edit ${planner.topic}`}
            render={<Link href={editHref} />}
            nativeButton={false}
          >
            <Pencil className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Duplicate ${planner.topic}`}
            onClick={onDuplicate}
          >
            <Copy className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Print or preview ${planner.topic}`}
            render={<Link href={`/planners/${planner.id}/print`} />}
            nativeButton={false}
          >
            <Printer className="size-3.5" />
          </Button>
          <DeleteRowDialog planner={planner} onConfirm={onDelete} />
        </div>
      </div>
    </div>
  );
}

export function MyPlannersView() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [subjectId, setSubjectId] = useState(ALL_VALUE);
  const [classLevelId, setClassLevelId] = useState(ALL_VALUE);
  const [term, setTerm] = useState(ALL_VALUE);
  const [status, setStatus] = useState(ALL_VALUE);

  const [subjects, setSubjects] = useState<CurriculumOption[]>([]);
  const [classLevels, setClassLevels] = useState<CurriculumOption[]>([]);

  const [rows, setRows] = useState<PlannerListRowDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const loading = rows === null && error === null;
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/api/curriculum/subjects").then((r) => r.json()),
      fetch("/api/curriculum/class-levels/all").then((r) => r.json()),
    ])
      .then(([subjectsRes, classLevelsRes]) => {
        if (cancelled) return;
        setSubjects(subjectsRes.data ?? []);
        setClassLevels(classLevelsRes.data ?? []);
      })
      .catch(() => {
        // Filter dropdowns are a convenience — leave them empty on failure
        // rather than blocking the list itself.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const query = useMemo(
    () => buildQuery({ search: debouncedSearch, subjectId, classLevelId, term, status }),
    [debouncedSearch, subjectId, classLevelId, term, status],
  );
  const filtersActive =
    debouncedSearch.trim() !== "" ||
    subjectId !== ALL_VALUE ||
    classLevelId !== ALL_VALUE ||
    term !== ALL_VALUE ||
    status !== ALL_VALUE;

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/planners${query}`)
      .then(async (res) => {
        const body = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(body?.error?.message ?? "Failed to load your planners.");
        }
        return body.data as PlannerListRowDto[];
      })
      .then((data) => {
        if (cancelled) return;
        setRows(data);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load your planners.");
      });
    return () => {
      cancelled = true;
    };
  }, [query, refreshToken]);

  function refresh() {
    setRefreshToken((t) => t + 1);
  }

  async function handleDelete(id: string) {
    setActionError(null);
    setBusyId(id);
    try {
      const res = await fetch(`/api/planners/${id}`, { method: "DELETE" });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(body?.error?.message ?? "Failed to delete the planner.");
      }
      setRows((prev) => prev?.filter((r) => r.id !== id) ?? prev);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to delete the planner.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDuplicate(id: string) {
    setActionError(null);
    setBusyId(id);
    try {
      const res = await fetch(`/api/planners/${id}/duplicate`, { method: "POST" });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(body?.error?.message ?? "Failed to duplicate the planner.");
      }
      refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to duplicate the planner.");
    } finally {
      setBusyId(null);
    }
  }

  function clearFilters() {
    setSearch("");
    setDebouncedSearch("");
    setSubjectId(ALL_VALUE);
    setClassLevelId(ALL_VALUE);
    setTerm(ALL_VALUE);
    setStatus(ALL_VALUE);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">My Lesson Planners</h1>
          <p className="text-sm text-muted-foreground">
            Search, filter, and manage the lesson planners you&apos;ve created.
          </p>
        </div>
        <Button render={<Link href="/planners/new" />} nativeButton={false}>
          <NotebookPen className="size-4" />
          Create New Planner
        </Button>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by class, topic, or strand…"
          aria-label="Search planners"
          className="sm:max-w-xs"
        />

        <Select
          value={subjectId}
          onValueChange={(v) => setSubjectId(v as string)}
        >
          <SelectTrigger aria-label="Filter by subject" className="sm:w-40">
            <SelectValue placeholder="Subject">
              {(v: string) =>
                v === ALL_VALUE ? "All subjects" : (subjects.find((s) => s.id === v)?.label ?? v)
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>All subjects</SelectItem>
            {subjects.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={classLevelId}
          onValueChange={(v) => setClassLevelId(v as string)}
        >
          <SelectTrigger aria-label="Filter by class or form" className="sm:w-40">
            <SelectValue placeholder="Class / Form">
              {(v: string) =>
                v === ALL_VALUE ? "All classes" : (classLevels.find((c) => c.id === v)?.label ?? v)
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>All classes</SelectItem>
            {classLevels.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={term} onValueChange={(v) => setTerm(v as string)}>
          <SelectTrigger aria-label="Filter by term" className="sm:w-32">
            <SelectValue placeholder="Term">
              {(v: string) =>
                v === ALL_VALUE ? "All terms" : (TERM_OPTIONS.find((t) => t.value === v)?.label ?? v)
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>All terms</SelectItem>
            {TERM_OPTIONS.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={(v) => setStatus(v as string)}>
          <SelectTrigger aria-label="Filter by status" className="sm:w-32">
            <SelectValue placeholder="Status">
              {(v: string) =>
                v === ALL_VALUE ? "All statuses" : STATUS_LABEL[v as PlannerListRowDto["status"]]
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>All statuses</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="PUBLISHED">Published</SelectItem>
          </SelectContent>
        </Select>

        {filtersActive ? (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear filters
          </Button>
        ) : null}
      </div>

      <p className="text-xs text-muted-foreground">Sorted by most recently updated.</p>

      {actionError ? (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      ) : null}

      {loading ? (
        <div className="flex flex-col gap-3">
          <RowSkeleton />
          <RowSkeleton />
          <RowSkeleton />
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>
            {error}{" "}
            <button
              type="button"
              onClick={refresh}
              className="font-medium underline underline-offset-2"
            >
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
              <p className="text-sm font-medium text-foreground">No planners match your filters</p>
              <p className="text-sm text-muted-foreground">
                Try a different search term or clear your filters to see all your planners.
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={clearFilters}>
              Clear filters
            </Button>
          </div>
        ) : (
          <EmptyState
            icon={NotebookPen}
            title="No planners yet"
            description="Create your first lesson planner to see it here."
            actionLabel="Create Planner"
            actionHref="/planners/new"
          />
        )
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((planner) => (
            <PlannerRow
              key={planner.id}
              planner={planner}
              busy={busyId === planner.id}
              onDelete={() => handleDelete(planner.id)}
              onDuplicate={() => handleDuplicate(planner.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

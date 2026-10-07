"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, ChevronRight, RotateCcw, Search, SearchX } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurriculumOptions, type CurriculumOption } from "@/hooks/useCurriculumOptions";
import { cn } from "@/lib/utils";

type NodeKind = "strand" | "subStrand" | "contentStandard" | "learningOutcome" | "learningIndicator";

const KIND_LABEL: Record<NodeKind, string> = {
  strand: "Strand",
  subStrand: "Sub-strand",
  contentStandard: "Content Standard",
  learningOutcome: "Learning Outcome",
  learningIndicator: "Learning Indicator",
};

const CHILD_KIND: Record<NodeKind, NodeKind | null> = {
  strand: "subStrand",
  subStrand: "contentStandard",
  contentStandard: "learningOutcome",
  learningOutcome: "learningIndicator",
  learningIndicator: null,
};

function childUrl(kind: NodeKind, parentId: string): string | null {
  switch (kind) {
    case "strand":
      return `/api/curriculum/sub-strands?strandId=${parentId}`;
    case "subStrand":
      return `/api/curriculum/content-standards?subStrandId=${parentId}`;
    case "contentStandard":
      return `/api/curriculum/learning-outcomes?contentStandardId=${parentId}`;
    case "learningOutcome":
      return `/api/curriculum/learning-indicators?learningOutcomeId=${parentId}`;
    default:
      return null;
  }
}

function TreeNode({ id, label, kind, depth }: { id: string; label: string; kind: NodeKind; depth: number }) {
  const [expanded, setExpanded] = useState(false);
  const childKind = CHILD_KIND[kind];
  const { options, status, errorMessage, refetch } = useCurriculumOptions(
    expanded && childKind ? childUrl(kind, id) : null,
  );

  return (
    <div style={{ marginLeft: depth > 0 ? 16 : 0 }} className={depth > 0 ? "border-l pl-3" : undefined}>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-start gap-1.5 rounded-md py-1.5 text-left text-sm hover:bg-muted"
        aria-expanded={expanded}
      >
        <ChevronRight
          className={cn("mt-0.5 size-3.5 shrink-0 text-muted-foreground transition-transform", expanded && "rotate-90")}
          aria-hidden="true"
        />
        <span>
          <span className="mr-1.5 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
            {KIND_LABEL[kind]}
          </span>
          <span className="text-foreground">{label}</span>
        </span>
      </button>

      {expanded ? (
        <div className="flex flex-col gap-0.5 pb-1">
          {status === "loading" ? (
            <div className="ml-5 flex flex-col gap-1.5 py-1">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : status === "error" ? (
            <div
              role="alert"
              className="ml-5 flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-2 py-1 text-xs text-destructive"
            >
              <AlertCircle className="size-3.5 shrink-0" />
              <span className="flex-1">{errorMessage ?? "Failed to load."}</span>
              <Button variant="ghost" size="icon-xs" onClick={refetch} aria-label="Retry">
                <RotateCcw className="size-3" />
              </Button>
            </div>
          ) : options.length === 0 ? (
            <p className="ml-5 py-1 text-xs text-muted-foreground">Nothing here yet.</p>
          ) : childKind === "learningIndicator" ? (
            <ul className="ml-5 flex list-disc flex-col gap-1 py-1 pl-4 marker:text-muted-foreground">
              {options.map((option) => (
                <li key={option.id} className="text-sm text-foreground">
                  {option.label}
                </li>
              ))}
            </ul>
          ) : (
            options.map((option: CurriculumOption) => (
              <TreeNode key={option.id} id={option.id} label={option.label} kind={childKind!} depth={depth + 1} />
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}

interface SearchResult {
  strandId: string;
  strandName: string;
  subStrandId: string;
  subStrandName: string;
  contentStandardId: string;
  contentStandardLabel: string;
  learningOutcomeId: string;
  learningOutcomeLabel: string;
  learningIndicatorId: string;
  learningIndicatorLabel: string;
}

function SearchResults({ subjectId, classLevelId, query }: { subjectId: string; classLevelId: string; query: string }) {
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(
      `/api/curriculum/search?subjectId=${subjectId}&classLevelId=${classLevelId}&q=${encodeURIComponent(query)}`,
    )
      .then(async (res) => {
        const body = await res.json().catch(() => null);
        if (!res.ok) throw new Error(body?.error?.message ?? "Search failed.");
        return body.data as SearchResult[];
      })
      .then((data) => {
        if (cancelled) return;
        setResults(data);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Search failed.");
      });
    return () => {
      cancelled = true;
    };
  }, [subjectId, classLevelId, query]);

  const loading = results === null && error === null;

  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div role="alert" className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
        <AlertCircle className="size-4 shrink-0" />
        {error}
      </div>
    );
  }

  if (!results || results.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <SearchX className="size-5 text-muted-foreground" aria-hidden="true" />
        <p className="text-sm font-medium text-foreground">No matches for &ldquo;{query}&rdquo;</p>
        <p className="text-sm text-muted-foreground">Try a different search term.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {results.map((r) => (
        <div key={r.learningIndicatorId} className="rounded-lg border bg-card p-3">
          <p className="text-xs text-muted-foreground">
            {r.strandName} &rsaquo; {r.subStrandName} &rsaquo; {r.contentStandardLabel} &rsaquo;{" "}
            {r.learningOutcomeLabel}
          </p>
          <p className="mt-1 text-sm font-medium text-foreground">{r.learningIndicatorLabel}</p>
        </div>
      ))}
    </div>
  );
}

export function CurriculumTreeBrowser({
  subjectId,
  classLevelId,
  subjectLabel,
  classLevelLabel,
  strands,
}: {
  subjectId: string;
  classLevelId: string;
  subjectLabel: string;
  classLevelLabel: string;
  strands: CurriculumOption[];
}) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Button variant="ghost" size="sm" render={<Link href="/curriculum/browse" />} nativeButton={false}>
          <ArrowLeft className="size-4" />
          All subjects
        </Button>
        <h1 className="mt-1 text-xl font-semibold text-foreground">{subjectLabel}</h1>
        <p className="text-sm text-muted-foreground">{classLevelLabel} &middot; read-only curriculum reference</p>
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search strands, standards, indicators…"
          aria-label="Search this subject's curriculum"
          className="pl-8"
        />
      </div>

      {debouncedSearch ? (
        <SearchResults subjectId={subjectId} classLevelId={classLevelId} query={debouncedSearch} />
      ) : strands.length === 0 ? (
        <p className="text-sm text-muted-foreground">No strands have been added for this subject and class yet.</p>
      ) : (
        <div className="flex flex-col gap-1 rounded-xl border bg-card p-3">
          {strands.map((strand) => (
            <TreeNode key={strand.id} id={strand.id} label={strand.label} kind="strand" depth={0} />
          ))}
        </div>
      )}
    </div>
  );
}

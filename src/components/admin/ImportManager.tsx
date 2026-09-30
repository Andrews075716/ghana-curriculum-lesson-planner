"use client";

import { useRef, useState } from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import type { ImportFormat, ImportIssue, ImportPreview } from "@/server/services/curriculum-import/types";

const LEVEL_LABELS: Record<keyof ImportPreview["counts"], string> = {
  subjects: "Subjects",
  classLevels: "Class Levels",
  curriculumVersions: "Curriculum Versions",
  strands: "Strands",
  subStrands: "Sub-strands",
  contentStandards: "Content Standards",
  learningOutcomes: "Learning Outcomes",
  learningIndicators: "Learning Indicators",
};

function IssueList({ issues }: { issues: ImportIssue[] }) {
  if (issues.length === 0) return null;
  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");

  return (
    <div className="flex flex-col gap-2">
      {errors.length > 0 ? (
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-destructive">{errors.length} error(s) — must be fixed before importing</p>
          <ul className="flex flex-col gap-1 rounded-lg border border-destructive/30 bg-destructive/5 p-2 text-xs">
            {errors.map((issue, i) => (
              <li key={i} className="text-destructive">
                <span className="font-mono">{issue.path}</span>: {issue.message}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {warnings.length > 0 ? (
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-amber-700 dark:text-amber-500">{warnings.length} warning(s)</p>
          <ul className="flex flex-col gap-1 rounded-lg border border-amber-500/30 bg-amber-500/5 p-2 text-xs">
            {warnings.map((issue, i) => (
              <li key={i} className="text-amber-700 dark:text-amber-500">
                <span className="font-mono">{issue.path}</span>: {issue.message}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function CountsTable({ counts }: { counts: ImportPreview["counts"] }) {
  const rows = (Object.keys(counts) as (keyof ImportPreview["counts"])[]).filter((key) => {
    const c = counts[key];
    return c.create + c.update + c.unchanged > 0;
  });

  if (rows.length === 0) return <p className="text-sm text-muted-foreground">Nothing to import.</p>;

  return (
    <table className="w-full text-left text-sm">
      <thead className="border-b text-xs text-muted-foreground">
        <tr>
          <th className="py-1.5 font-medium">Level</th>
          <th className="py-1.5 font-medium">Create</th>
          <th className="py-1.5 font-medium">Update</th>
          <th className="py-1.5 font-medium">Unchanged</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((key) => (
          <tr key={key} className="border-b last:border-0">
            <td className="py-1.5">{LEVEL_LABELS[key]}</td>
            <td className="py-1.5 text-emerald-700 dark:text-emerald-500">{counts[key].create}</td>
            <td className="py-1.5 text-amber-700 dark:text-amber-500">{counts[key].update}</td>
            <td className="py-1.5 text-muted-foreground">{counts[key].unchanged}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function ImportManager() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [format, setFormat] = useState<ImportFormat | null>(null);
  const [content, setContent] = useState<string | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [committed, setCommitted] = useState<ImportPreview | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setPreview(null);
    setCommitted(null);
    setError(null);
    if (!file) {
      setFileName(null);
      setContent(null);
      setFormat(null);
      return;
    }
    const detectedFormat: ImportFormat | null = file.name.toLowerCase().endsWith(".csv")
      ? "csv"
      : file.name.toLowerCase().endsWith(".json")
        ? "json"
        : null;
    if (!detectedFormat) {
      setError("Please choose a .csv or .json file.");
      setFileName(null);
      setContent(null);
      setFormat(null);
      return;
    }
    setFileName(file.name);
    setFormat(detectedFormat);
    const reader = new FileReader();
    reader.onload = () => setContent(String(reader.result ?? ""));
    reader.readAsText(file);
  }

  async function handlePreview() {
    if (!format || content === null) return;
    setIsPreviewing(true);
    setError(null);
    setPreview(null);
    setCommitted(null);
    try {
      const res = await fetch("/api/admin/curriculum/import/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format, content }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error?.message ?? "Preview failed.");
      setPreview(body.data as ImportPreview);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Preview failed.");
    } finally {
      setIsPreviewing(false);
    }
  }

  async function handleCommit() {
    if (!format || content === null) return;
    setIsCommitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/curriculum/import/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format, content }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error?.message ?? "Import failed.");
      setCommitted(body.data as ImportPreview);
      setPreview(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed.");
    } finally {
      setIsCommitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-foreground">Import Curriculum Data</h1>
      <p className="text-sm text-muted-foreground">
        Upload a CSV or JSON file. It&apos;s validated and previewed first — nothing is written to the
        database until you confirm.
      </p>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="size-4" />
            Choose file
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.json"
            className="hidden"
            onChange={handleFileChange}
          />
          {fileName ? <span className="text-sm text-muted-foreground">{fileName}</span> : null}
          <Button onClick={handlePreview} disabled={!content || isPreviewing}>
            {isPreviewing ? <Loader2 className="size-4 animate-spin" /> : null}
            Preview
          </Button>
        </div>
      </Card>

      {error ? (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {preview ? (
        <Card className="flex flex-col gap-4 p-4" aria-live="polite">
          <CountsTable counts={preview.counts} />
          <IssueList issues={preview.issues} />
          {preview.canCommit ? (
            <Button onClick={handleCommit} disabled={isCommitting} className="self-start">
              {isCommitting ? <Loader2 className="size-4 animate-spin" /> : null}
              Confirm Import
            </Button>
          ) : (
            <Alert variant="destructive">
              <AlertTriangle className="size-4" />
              <AlertDescription>Fix the error(s) above and re-upload before importing.</AlertDescription>
            </Alert>
          )}
        </Card>
      ) : null}

      {committed ? (
        <Card className="flex flex-col gap-4 p-4" aria-live="polite">
          <Alert>
            <CheckCircle2 className="size-4" />
            <AlertDescription>Import committed successfully.</AlertDescription>
          </Alert>
          <CountsTable counts={committed.counts} />
        </Card>
      ) : null}
    </div>
  );
}

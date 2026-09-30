"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Archive,
  ArchiveRestore,
  Pencil,
  School,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
import { CurriculumSelectField } from "@/components/curriculum/CurriculumSelectField";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { useCurriculumOptions } from "@/hooks/useCurriculumOptions";

interface ClassRowDto {
  id: string;
  name: string;
  classLevelId: string;
  classLevelName: string;
  subjectId: string;
  subjectName: string;
  academicYear: string;
  notes: string | null;
  archived: boolean;
  updatedAt: string;
  plannerCount: number;
}

interface FormState {
  name: string;
  subjectId: string;
  classLevelId: string;
  academicYear: string;
  notes: string;
}

function emptyForm(defaultAcademicYear: string): FormState {
  return { name: "", subjectId: "", classLevelId: "", academicYear: defaultAcademicYear, notes: "" };
}

function ClassForm({
  form,
  setForm,
}: {
  form: FormState;
  setForm: (updater: (prev: FormState) => FormState) => void;
}) {
  const subjects = useCurriculumOptions("/api/curriculum/subjects");
  const classLevels = useCurriculumOptions("/api/curriculum/class-levels/all");

  return (
    <div className="flex flex-col gap-4 px-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="class-name">Class Name</Label>
        <Input
          id="class-name"
          value={form.name}
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="e.g. Form 1 Gold"
          required
        />
      </div>

      <CurriculumSelectField
        id="class-subject"
        label="Subject"
        value={form.subjectId}
        onValueChange={(v) => setForm((prev) => ({ ...prev, subjectId: v }))}
        options={subjects.options}
        status={subjects.status}
        errorMessage={subjects.errorMessage}
        onRetry={subjects.refetch}
        emptyMessage="No subjects available yet."
      />

      <CurriculumSelectField
        id="class-level"
        label="Form / Level"
        value={form.classLevelId}
        onValueChange={(v) => setForm((prev) => ({ ...prev, classLevelId: v }))}
        options={classLevels.options}
        status={classLevels.status}
        errorMessage={classLevels.errorMessage}
        onRetry={classLevels.refetch}
        emptyMessage="No class levels available yet."
      />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="class-year">Academic Year</Label>
        <Input
          id="class-year"
          value={form.academicYear}
          onChange={(e) => setForm((prev) => ({ ...prev, academicYear: e.target.value }))}
          placeholder="e.g. 2025/2026"
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="class-notes">Notes (optional)</Label>
        <Textarea
          id="class-notes"
          value={form.notes}
          onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
          placeholder="Anything else worth remembering about this class"
        />
      </div>
    </div>
  );
}

function ClassCard({
  row,
  onEdit,
  onToggleArchive,
}: {
  row: ClassRowDto;
  onEdit: () => void;
  onToggleArchive: () => void;
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-foreground">{row.name}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {row.subjectName} &middot; {row.classLevelName} &middot; {row.academicYear}
          </p>
        </div>
        {row.archived ? <Badge variant="secondary">Archived</Badge> : null}
      </div>

      {row.notes ? <p className="mt-2 text-sm text-muted-foreground">{row.notes}</p> : null}

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users className="size-3.5" />
          {row.plannerCount} {row.plannerCount === 1 ? "planner" : "planners"} associated
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" aria-label={`Edit ${row.name}`} onClick={onEdit}>
            <Pencil className="size-3.5" />
          </Button>
          {row.archived ? (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Unarchive ${row.name}`}
              onClick={onToggleArchive}
            >
              <ArchiveRestore className="size-3.5" />
            </Button>
          ) : (
            <AlertDialog>
              <AlertDialogTrigger
                render={<Button variant="ghost" size="icon-sm" aria-label={`Archive ${row.name}`} />}
              >
                <Archive className="size-3.5" />
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Archive this class?</AlertDialogTitle>
                  <AlertDialogDescription>
                    &ldquo;{row.name}&rdquo; will be hidden from the active class list. You can
                    unarchive it later — nothing is deleted.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onToggleArchive}>Archive</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
    </div>
  );
}

export function ClassesView({ defaultAcademicYear }: { defaultAcademicYear: string }) {
  const [rows, setRows] = useState<ClassRowDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(() => emptyForm(defaultAcademicYear));
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loading = rows === null && error === null;

  useEffect(() => {
    let cancelled = false;
    fetch("/api/classes")
      .then(async (res) => {
        const body = await res.json().catch(() => null);
        if (!res.ok) throw new Error(body?.error?.message ?? "Failed to load your classes.");
        return body.data as ClassRowDto[];
      })
      .then((data) => {
        if (cancelled) return;
        setRows(data);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load your classes.");
      });
    return () => {
      cancelled = true;
    };
  }, [refreshToken]);

  function refresh() {
    setRefreshToken((t) => t + 1);
  }

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm(defaultAcademicYear));
    setFormError(null);
    setSheetOpen(true);
  }

  function openEdit(row: ClassRowDto) {
    setEditingId(row.id);
    setForm({
      name: row.name,
      subjectId: row.subjectId,
      classLevelId: row.classLevelId,
      academicYear: row.academicYear,
      notes: row.notes ?? "",
    });
    setFormError(null);
    setSheetOpen(true);
  }

  async function handleSubmit() {
    setSubmitting(true);
    setFormError(null);
    const payload = {
      name: form.name,
      subjectId: form.subjectId,
      classLevelId: form.classLevelId,
      academicYear: form.academicYear,
      notes: form.notes.trim() === "" ? null : form.notes,
    };
    try {
      const res = editingId
        ? await fetch(`/api/classes/${editingId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/classes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error?.message ?? "Failed to save the class.");
      setSheetOpen(false);
      refresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save the class.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleArchive(row: ClassRowDto) {
    setActionError(null);
    try {
      const res = await fetch(`/api/classes/${row.id}/archive`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: !row.archived }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error?.message ?? "Failed to update the class.");
      refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to update the class.");
    }
  }

  const visibleRows = (rows ?? []).filter((r) => showArchived || !r.archived);
  const formValid =
    form.name.trim() !== "" &&
    form.subjectId !== "" &&
    form.classLevelId !== "" &&
    form.academicYear.trim() !== "";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Classes</h1>
          <p className="text-sm text-muted-foreground">
            The classes you teach — no pupil-identifying information is stored here.
          </p>
        </div>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger render={<Button onClick={openCreate} />}>Create Class</SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>{editingId ? "Edit Class" : "Create Class"}</SheetTitle>
            </SheetHeader>
            <ClassForm form={form} setForm={setForm} />
            {formError ? (
              <p role="alert" className="flex items-center gap-1.5 px-4 text-sm text-destructive">
                <AlertCircle className="size-4" />
                {formError}
              </p>
            ) : null}
            <SheetFooter>
              <Button onClick={handleSubmit} disabled={!formValid || submitting}>
                {submitting ? "Saving…" : editingId ? "Save Changes" : "Create Class"}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      <label className="flex w-fit items-center gap-2 text-sm text-muted-foreground">
        <input
          type="checkbox"
          checked={showArchived}
          onChange={(e) => setShowArchived(e.target.checked)}
          className="size-4 rounded border-input"
        />
        Show archived classes
      </label>

      {actionError ? (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      ) : null}

      {loading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
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
      ) : visibleRows.length === 0 ? (
        <EmptyState
          icon={School}
          title={rows && rows.length > 0 ? "No active classes" : "No classes yet"}
          description={
            rows && rows.length > 0
              ? "All your classes are archived. Turn on “Show archived classes” to see them, or create a new one above."
              : "Use the “Create Class” button above to add your first class."
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {visibleRows.map((row) => (
            <ClassCard
              key={row.id}
              row={row}
              onEdit={() => openEdit(row)}
              onToggleArchive={() => handleToggleArchive(row)}
            />
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        A planner counts toward a class when its Class/Form field (set in{" "}
        <Link href="/planners/new" className="underline underline-offset-2">
          Create Planner
        </Link>
        ) matches this class&apos;s name.
      </p>
    </div>
  );
}

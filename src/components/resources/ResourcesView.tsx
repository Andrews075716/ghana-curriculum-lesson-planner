"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  BookOpen,
  ExternalLink,
  Link2,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { EmptyState } from "@/components/dashboard/EmptyState";

type ResourceType = "LINK" | "DOCUMENT" | "TEXTBOOK" | "VIDEO" | "OTHER";

const TYPE_OPTIONS: { value: ResourceType; label: string }[] = [
  { value: "LINK", label: "Link" },
  { value: "DOCUMENT", label: "Document" },
  { value: "TEXTBOOK", label: "Textbook" },
  { value: "VIDEO", label: "Video" },
  { value: "OTHER", label: "Other" },
];
const TYPE_LABEL: Record<ResourceType, string> = Object.fromEntries(
  TYPE_OPTIONS.map((o) => [o.value, o.label]),
) as Record<ResourceType, string>;

interface ResourceRowDto {
  id: string;
  title: string;
  type: ResourceType;
  url: string | null;
  description: string | null;
  updatedAt: string;
  associatedPlanners: { id: string; topic: string }[];
}

interface PlannerOption {
  id: string;
  topic: string;
  classSection: string | null;
}

interface FormState {
  title: string;
  type: ResourceType;
  url: string;
  description: string;
}

function emptyForm(): FormState {
  return { title: "", type: "LINK", url: "", description: "" };
}

function ResourceForm({ form, setForm }: { form: FormState; setForm: (u: (p: FormState) => FormState) => void }) {
  return (
    <div className="flex flex-col gap-4 px-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="resource-title">Title</Label>
        <Input
          id="resource-title"
          value={form.title}
          onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
          placeholder="e.g. Binary Numbers Explainer"
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="resource-type">Type</Label>
        <Select value={form.type} onValueChange={(v) => setForm((p) => ({ ...p, type: v as ResourceType }))}>
          <SelectTrigger id="resource-type" className="w-full">
            <SelectValue>{(v: ResourceType) => TYPE_LABEL[v]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {TYPE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="resource-url">URL (optional)</Label>
        <Input
          id="resource-url"
          value={form.url}
          onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))}
          placeholder="https://…"
          type="url"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="resource-description">Description (optional)</Label>
        <Textarea
          id="resource-description"
          value={form.description}
          onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          placeholder="What is this resource, and how is it used?"
        />
      </div>
    </div>
  );
}

function AssociatePlannerControl({
  resourceId,
  associatedPlanners,
  allPlanners,
  onChanged,
}: {
  resourceId: string;
  associatedPlanners: { id: string; topic: string }[];
  allPlanners: PlannerOption[];
  onChanged: () => void;
}) {
  const [selected, setSelected] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const associatedIds = new Set(associatedPlanners.map((p) => p.id));
  const options = allPlanners.filter((p) => !associatedIds.has(p.id));

  async function setAssociation(plannerId: string, associated: boolean) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/resources/${resourceId}/associations`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plannerId, associated }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error?.message ?? "Failed to update association.");
      setSelected("");
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update association.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 border-t pt-3">
      <p className="mb-1.5 text-xs font-medium text-muted-foreground">Used in lesson planners</p>
      {associatedPlanners.length === 0 ? (
        <p className="text-xs text-muted-foreground">Not associated with any planner yet.</p>
      ) : (
        <ul className="mb-2 flex flex-col gap-1">
          {associatedPlanners.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-2 text-xs">
              <Link href={`/planners/${p.id}`} className="truncate hover:underline">
                {p.topic}
              </Link>
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label={`Remove association with ${p.topic}`}
                disabled={busy}
                onClick={() => setAssociation(p.id, false)}
              >
                <X className="size-3" />
              </Button>
            </li>
          ))}
        </ul>
      )}
      {options.length > 0 ? (
        <div className="flex items-center gap-1.5">
          <Select value={selected} onValueChange={(v) => setSelected(v as string)}>
            <SelectTrigger size="sm" className="w-full" aria-label="Choose a planner to associate">
              <SelectValue placeholder="Associate with a planner…" />
            </SelectTrigger>
            <SelectContent>
              {options.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.topic}
                  {p.classSection ? ` (${p.classSection})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            variant="outline"
            disabled={!selected || busy}
            onClick={() => selected && setAssociation(selected, true)}
          >
            Attach
          </Button>
        </div>
      ) : null}
      {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

function ResourceCard({
  row,
  allPlanners,
  onEdit,
  onDelete,
  onChanged,
}: {
  row: ResourceRowDto;
  allPlanners: PlannerOption[];
  onEdit: () => void;
  onDelete: () => void;
  onChanged: () => void;
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-foreground">{row.title}</p>
          {row.url ? (
            <a
              href={row.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline"
            >
              <ExternalLink className="size-3" />
              {row.url}
            </a>
          ) : null}
        </div>
        <Badge variant="secondary">{TYPE_LABEL[row.type]}</Badge>
      </div>

      {row.description ? <p className="mt-2 text-sm text-muted-foreground">{row.description}</p> : null}

      <div className="mt-3 flex items-center justify-end gap-1">
        <Button variant="ghost" size="icon-sm" aria-label={`Edit ${row.title}`} onClick={onEdit}>
          <Pencil className="size-3.5" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger
            render={<Button variant="ghost" size="icon-sm" aria-label={`Delete ${row.title}`} />}
          >
            <Trash2 className="size-3.5 text-destructive" />
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this resource?</AlertDialogTitle>
              <AlertDialogDescription>
                &ldquo;{row.title}&rdquo; will be permanently removed from your library and
                detached from any planners it&apos;s associated with.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={onDelete}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <AssociatePlannerControl
        resourceId={row.id}
        associatedPlanners={row.associatedPlanners}
        allPlanners={allPlanners}
        onChanged={onChanged}
      />
    </div>
  );
}

export function ResourcesView() {
  const [rows, setRows] = useState<ResourceRowDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [allPlanners, setAllPlanners] = useState<PlannerOption[]>([]);
  const [refreshToken, setRefreshToken] = useState(0);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loading = rows === null && error === null;

  useEffect(() => {
    let cancelled = false;
    fetch("/api/resources")
      .then(async (res) => {
        const body = await res.json().catch(() => null);
        if (!res.ok) throw new Error(body?.error?.message ?? "Failed to load your resources.");
        return body.data as ResourceRowDto[];
      })
      .then((data) => {
        if (cancelled) return;
        setRows(data);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load your resources.");
      });
    return () => {
      cancelled = true;
    };
  }, [refreshToken]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/planners")
      .then((r) => r.json())
      .then((body) => {
        if (cancelled) return;
        const data = (body?.data ?? []) as Array<{
          id: string;
          topic: string;
          classSection: string | null;
        }>;
        setAllPlanners(data.map((p) => ({ id: p.id, topic: p.topic, classSection: p.classSection })));
      })
      .catch(() => {
        // Association picker is a convenience — leave it empty on failure.
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
    setForm(emptyForm());
    setFormError(null);
    setSheetOpen(true);
  }

  function openEdit(row: ResourceRowDto) {
    setEditingId(row.id);
    setForm({ title: row.title, type: row.type, url: row.url ?? "", description: row.description ?? "" });
    setFormError(null);
    setSheetOpen(true);
  }

  async function handleSubmit() {
    setSubmitting(true);
    setFormError(null);
    const payload = {
      title: form.title,
      type: form.type,
      url: form.url.trim() === "" ? "" : form.url.trim(),
      description: form.description.trim() === "" ? null : form.description,
    };
    try {
      const res = editingId
        ? await fetch(`/api/resources/${editingId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/resources", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error?.message ?? "Failed to save the resource.");
      setSheetOpen(false);
      refresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save the resource.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    setActionError(null);
    try {
      const res = await fetch(`/api/resources/${id}`, { method: "DELETE" });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error?.message ?? "Failed to delete the resource.");
      refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to delete the resource.");
    }
  }

  const formValid = form.title.trim() !== "";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Resources</h1>
          <p className="text-sm text-muted-foreground">
            Your teaching &amp; learning resource library — link resources to the lesson planners
            that use them.
          </p>
        </div>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger render={<Button onClick={openCreate} />}>
            <Link2 className="size-4" />
            Add Resource
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>{editingId ? "Edit Resource" : "Add Resource"}</SheetTitle>
            </SheetHeader>
            <ResourceForm form={form} setForm={setForm} />
            {formError ? (
              <p role="alert" className="flex items-center gap-1.5 px-4 text-sm text-destructive">
                <AlertCircle className="size-4" />
                {formError}
              </p>
            ) : null}
            <SheetFooter>
              <Button onClick={handleSubmit} disabled={!formValid || submitting}>
                {submitting ? "Saving…" : editingId ? "Save Changes" : "Add Resource"}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      {actionError ? (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      ) : null}

      {loading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
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
        <EmptyState
          icon={BookOpen}
          title="No resources yet"
          description="Use the “Add Resource” button above to build your library."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {rows.map((row) => (
            <ResourceCard
              key={row.id}
              row={row}
              allPlanners={allPlanners}
              onEdit={() => openEdit(row)}
              onDelete={() => handleDelete(row.id)}
              onChanged={refresh}
            />
          ))}
        </div>
      )}
    </div>
  );
}

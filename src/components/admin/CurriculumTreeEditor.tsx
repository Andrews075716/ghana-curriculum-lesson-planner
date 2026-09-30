"use client";

import { useEffect, useState } from "react";
import { AlertCircle, ChevronDown, ChevronRight, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface Option {
  id: string;
  code?: string | null;
  name?: string;
}

type NodeKind = "subStrand" | "contentStandard" | "learningOutcome" | "learningIndicator";

interface KindConfig {
  label: string;
  listPath: (parentId: string) => string;
  createPath: string;
  itemPath: (id: string) => string;
  parentField: string;
  hasCode: boolean;
  textField: "name" | "description";
  textLabel: string;
  childKind: NodeKind | null;
}

const KIND_CONFIG: Record<NodeKind, KindConfig> = {
  subStrand: {
    label: "Sub-strand",
    listPath: (strandId) => `/api/admin/curriculum/sub-strands?strandId=${strandId}`,
    createPath: "/api/admin/curriculum/sub-strands",
    itemPath: (id) => `/api/admin/curriculum/sub-strands/${id}`,
    parentField: "strandId",
    hasCode: true,
    textField: "name",
    textLabel: "Name",
    childKind: "contentStandard",
  },
  contentStandard: {
    label: "Content standard",
    listPath: (subStrandId) => `/api/admin/curriculum/content-standards?subStrandId=${subStrandId}`,
    createPath: "/api/admin/curriculum/content-standards",
    itemPath: (id) => `/api/admin/curriculum/content-standards/${id}`,
    parentField: "subStrandId",
    hasCode: true,
    textField: "description",
    textLabel: "Description",
    childKind: "learningOutcome",
  },
  learningOutcome: {
    label: "Learning outcome",
    listPath: (contentStandardId) => `/api/admin/curriculum/learning-outcomes?contentStandardId=${contentStandardId}`,
    createPath: "/api/admin/curriculum/learning-outcomes",
    itemPath: (id) => `/api/admin/curriculum/learning-outcomes/${id}`,
    parentField: "contentStandardId",
    hasCode: false,
    textField: "description",
    textLabel: "Description",
    childKind: "learningIndicator",
  },
  learningIndicator: {
    label: "Learning indicator",
    listPath: (learningOutcomeId) =>
      `/api/admin/curriculum/learning-indicators?learningOutcomeId=${learningOutcomeId}`,
    createPath: "/api/admin/curriculum/learning-indicators",
    itemPath: (id) => `/api/admin/curriculum/learning-indicators/${id}`,
    parentField: "learningOutcomeId",
    hasCode: true,
    textField: "description",
    textLabel: "Description",
    childKind: null,
  },
};

interface NodeItem {
  id: string;
  code?: string | null;
  name?: string;
  description?: string;
  sequence: number;
  [key: string]: unknown;
}

function NodeEditSheet({
  open,
  onOpenChange,
  kind,
  editing,
  onSaved,
  parentId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: NodeKind;
  editing: NodeItem | null;
  onSaved: (item: NodeItem, wasEdit: boolean) => void;
  parentId: string;
}) {
  const config = KIND_CONFIG[kind];
  // No effect needed to reset these when `editing` changes: the parent
  // remounts this component (via a `key` tied to what's being edited)
  // every time the sheet opens, so these lazy initializers alone are
  // enough to start each open with the right values.
  const [code, setCode] = useState(() => editing?.code ?? "");
  const [text, setText] = useState(() => (editing ? String(editing[config.textField] ?? "") : ""));
  const [sequence, setSequence] = useState(() => String(editing?.sequence ?? "1"));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        [config.parentField]: parentId,
        [config.textField]: text.trim(),
        sequence: Number(sequence),
      };
      if (config.hasCode) payload.code = code.trim() || undefined;

      const res = await fetch(editing ? config.itemPath(editing.id) : config.createPath, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error?.message ?? "Save failed.");
      onSaved(body.data as NodeItem, Boolean(editing));
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>
            {editing ? `Edit ${config.label.toLowerCase()}` : `Add ${config.label.toLowerCase()}`}
          </SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4 overflow-y-auto px-4">
          {config.hasCode ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="node-code">Code</Label>
              <Input id="node-code" value={code} onChange={(e) => setCode(e.target.value)} />
            </div>
          ) : null}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="node-text">
              {config.textLabel}
              <span aria-hidden="true" className="text-destructive"> *</span>
            </Label>
            {config.textField === "description" ? (
              <Textarea id="node-text" required value={text} onChange={(e) => setText(e.target.value)} rows={3} />
            ) : (
              <Input id="node-text" required value={text} onChange={(e) => setText(e.target.value)} />
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="node-sequence">
              Sequence
              <span aria-hidden="true" className="text-destructive"> *</span>
            </Label>
            <Input
              id="node-sequence"
              type="number"
              required
              value={sequence}
              onChange={(e) => setSequence(e.target.value)}
            />
          </div>
          {error ? (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <SheetFooter>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
              Save
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function NodeChildren({ kind, parentId, depth }: { kind: NodeKind; parentId: string; depth: number }) {
  const config = KIND_CONFIG[kind];
  const [items, setItems] = useState<NodeItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<NodeItem | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch(config.listPath(parentId))
      .then(async (res) => {
        const body = await res.json().catch(() => null);
        if (!res.ok) throw new Error(body?.error?.message ?? "Failed to load.");
        return body.data as NodeItem[];
      })
      .then((data) => {
        if (cancelled) return;
        setItems(data);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load.");
        setItems([]);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parentId]);

  async function handleDelete(item: NodeItem) {
    if (deletingId) return; // a delete is already in flight for this list
    const label = String(item[config.textField] ?? item.code ?? item.id).slice(0, 60);
    if (!window.confirm(`Delete "${label}"? This can't be undone.`)) return;
    setError(null);
    setDeletingId(item.id);
    try {
      const res = await fetch(config.itemPath(item.id), { method: "DELETE" });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error?.message ?? "Delete failed.");
      setItems((prev) => (prev ?? []).filter((it) => it.id !== item.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setDeletingId(null);
    }
  }

  if (items === null) {
    return (
      <div className="flex items-center gap-2 py-2 pl-6 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Loading {config.label.toLowerCase()}s...
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ paddingLeft: depth > 0 ? 20 : 0 }}>
      {error ? (
        <Alert variant="destructive" className="my-1">
          <AlertCircle className="size-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {items.map((item) => (
        <NodeRow
          key={item.id}
          kind={kind}
          item={item}
          depth={depth}
          isDeleting={deletingId === item.id}
          onEdit={() => {
            setEditing(item);
            setFormKey((k) => k + 1);
            setSheetOpen(true);
          }}
          onDelete={() => handleDelete(item)}
        />
      ))}
      <Button
        variant="ghost"
        size="sm"
        className="mt-1 self-start text-muted-foreground"
        onClick={() => {
          setEditing(null);
          setFormKey((k) => k + 1);
          setSheetOpen(true);
        }}
      >
        <Plus className="size-3.5" />
        Add {config.label.toLowerCase()}
      </Button>

      <NodeEditSheet
        key={formKey}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        kind={kind}
        editing={editing}
        parentId={parentId}
        onSaved={(saved, wasEdit) => {
          setItems((prev) => {
            const list = prev ?? [];
            return wasEdit ? list.map((it) => (it.id === saved.id ? saved : it)) : [...list, saved];
          });
        }}
      />
    </div>
  );
}

function NodeRow({
  kind,
  item,
  depth,
  isDeleting,
  onEdit,
  onDelete,
}: {
  kind: NodeKind;
  item: NodeItem;
  depth: number;
  isDeleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const config = KIND_CONFIG[kind];
  const [expanded, setExpanded] = useState(false);
  const text = String(item[config.textField] ?? "");

  return (
    <div className="border-l pl-2">
      <div className="flex items-center gap-1 rounded py-1.5 hover:bg-accent/50">
        {config.childKind ? (
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="flex size-5 shrink-0 items-center justify-center text-muted-foreground"
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
          </button>
        ) : (
          <span className="size-5 shrink-0" />
        )}
        <div className="min-w-0 flex-1">
          {item.code ? <span className="mr-2 font-mono text-xs text-muted-foreground">{item.code}</span> : null}
          <span className="text-sm text-foreground">{text.length > 120 ? `${text.slice(0, 120)}...` : text}</span>
          <span className="ml-2 text-xs text-muted-foreground">#{item.sequence}</span>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={onEdit} disabled={isDeleting} aria-label="Edit">
          <Pencil className="size-3.5" />
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={onDelete} disabled={isDeleting} aria-label="Delete">
          {isDeleting ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
        </Button>
      </div>
      {expanded && config.childKind ? (
        <NodeChildren kind={config.childKind} parentId={item.id} depth={depth + 1} />
      ) : null}
    </div>
  );
}

function StrandRow({
  strand,
  isDeleting,
  onEdit,
  onDelete,
}: {
  strand: NodeItem;
  isDeleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border">
      <div className="flex items-center gap-1 p-2">
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="flex size-5 shrink-0 items-center justify-center text-muted-foreground"
          aria-label={expanded ? "Collapse" : "Expand"}
        >
          {expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        </button>
        <div className="min-w-0 flex-1">
          {strand.code ? <span className="mr-2 font-mono text-xs text-muted-foreground">{strand.code}</span> : null}
          <span className="text-sm font-medium text-foreground">{strand.name}</span>
          <span className="ml-2 text-xs text-muted-foreground">#{strand.sequence}</span>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={onEdit} disabled={isDeleting} aria-label="Edit">
          <Pencil className="size-3.5" />
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={onDelete} disabled={isDeleting} aria-label="Delete">
          {isDeleting ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
        </Button>
      </div>
      {expanded ? (
        <div className="border-t px-2 pb-2">
          <NodeChildren kind="subStrand" parentId={strand.id} depth={1} />
        </div>
      ) : null}
    </div>
  );
}

function StrandEditSheet({
  open,
  onOpenChange,
  editing,
  subjectId,
  classLevelId,
  curriculumVersionId,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: NodeItem | null;
  subjectId: string;
  classLevelId: string;
  curriculumVersionId: string;
  onSaved: (item: NodeItem, wasEdit: boolean) => void;
}) {
  // No effect needed here either — see the comment in NodeEditSheet.
  const [code, setCode] = useState(() => editing?.code ?? "");
  const [name, setName] = useState(() => editing?.name ?? "");
  const [sequence, setSequence] = useState(() => String(editing?.sequence ?? "1"));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      const payload = {
        subjectId,
        classLevelId,
        curriculumVersionId,
        code: code.trim() || undefined,
        name: name.trim(),
        sequence: Number(sequence),
      };
      const res = await fetch(
        editing ? `/api/admin/curriculum/strands/${editing.id}` : "/api/admin/curriculum/strands",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error?.message ?? "Save failed.");
      onSaved(body.data as NodeItem, Boolean(editing));
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{editing ? "Edit strand" : "Add strand"}</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4 overflow-y-auto px-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="strand-code">Code</Label>
            <Input id="strand-code" value={code} onChange={(e) => setCode(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="strand-name">
              Name
              <span aria-hidden="true" className="text-destructive"> *</span>
            </Label>
            <Input id="strand-name" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="strand-sequence">
              Sequence
              <span aria-hidden="true" className="text-destructive"> *</span>
            </Label>
            <Input
              id="strand-sequence"
              type="number"
              required
              value={sequence}
              onChange={(e) => setSequence(e.target.value)}
            />
          </div>
          {error ? (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <SheetFooter>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
              Save
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

export function CurriculumTreeEditor({
  subjects,
  classLevels,
  versions,
}: {
  subjects: Option[];
  classLevels: Option[];
  versions: Option[];
}) {
  const [subjectId, setSubjectId] = useState<string>(subjects[0]?.id ?? "");
  const [classLevelId, setClassLevelId] = useState<string>(classLevels[0]?.id ?? "");
  const [curriculumVersionId, setCurriculumVersionId] = useState<string>(versions[0]?.id ?? "");
  const selectionKey = `${subjectId}|${classLevelId}|${curriculumVersionId}`;

  // Keyed by selection rather than a plain `strands`/`loading` pair, so a
  // selection change never needs a synchronous setState inside the effect
  // to show "loading" — `strands` below is simply undefined until this
  // selection's result has arrived (same technique as useCurriculumOptions).
  const [strandsByKey, setStrandsByKey] = useState<Record<string, NodeItem[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<NodeItem | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const strands = subjectId && classLevelId && curriculumVersionId ? (strandsByKey[selectionKey] ?? null) : [];

  useEffect(() => {
    if (!subjectId || !classLevelId || !curriculumVersionId) return;
    let cancelled = false;

    fetch(
      `/api/admin/curriculum/strands?subjectId=${subjectId}&classLevelId=${classLevelId}&curriculumVersionId=${curriculumVersionId}`,
    )
      .then(async (res) => {
        const body = await res.json().catch(() => null);
        if (!res.ok) throw new Error(body?.error?.message ?? "Failed to load strands.");
        return body.data as NodeItem[];
      })
      .then((data) => {
        if (cancelled) return;
        setStrandsByKey((prev) => ({ ...prev, [selectionKey]: data }));
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load strands.");
        setStrandsByKey((prev) => ({ ...prev, [selectionKey]: [] }));
      });

    return () => {
      cancelled = true;
    };
  }, [subjectId, classLevelId, curriculumVersionId, selectionKey]);

  async function handleDeleteStrand(strand: NodeItem) {
    if (deletingId) return; // a delete is already in flight
    if (!window.confirm(`Delete strand "${strand.name}"? This can't be undone.`)) return;
    setError(null);
    setDeletingId(strand.id);
    try {
      const res = await fetch(`/api/admin/curriculum/strands/${strand.id}`, { method: "DELETE" });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error?.message ?? "Delete failed.");
      setStrandsByKey((prev) => ({
        ...prev,
        [selectionKey]: (prev[selectionKey] ?? []).filter((s) => s.id !== strand.id),
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-foreground">Strands &amp; Indicators</h1>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label>Subject</Label>
          <Select value={subjectId} onValueChange={(v) => setSubjectId(String(v))}>
            <SelectTrigger className="w-full">
              <SelectValue>
                {(current: string | null) => subjects.find((s) => s.id === current)?.name ?? "Select subject"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {subjects.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Class level</Label>
          <Select value={classLevelId} onValueChange={(v) => setClassLevelId(String(v))}>
            <SelectTrigger className="w-full">
              <SelectValue>
                {(current: string | null) =>
                  classLevels.find((c) => c.id === current)?.name ?? "Select class level"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {classLevels.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Curriculum version</Label>
          <Select value={curriculumVersionId} onValueChange={(v) => setCurriculumVersionId(String(v))}>
            <SelectTrigger className="w-full">
              <SelectValue>
                {(current: string | null) => versions.find((v) => v.id === current)?.name ?? "Select version"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {versions.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {subjects.length === 0 || classLevels.length === 0 || versions.length === 0 ? (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>
            Create at least one subject, class level, and curriculum version before adding strands.
          </AlertDescription>
        </Alert>
      ) : null}

      {error ? (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-2">
        {strands === null ? (
          <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading strands...
          </div>
        ) : (
          strands.map((strand) => (
            <StrandRow
              key={strand.id}
              strand={strand}
              isDeleting={deletingId === strand.id}
              onEdit={() => {
                setEditing(strand);
                setFormKey((k) => k + 1);
                setSheetOpen(true);
              }}
              onDelete={() => handleDeleteStrand(strand)}
            />
          ))
        )}

        <Button
          variant="outline"
          size="sm"
          className="self-start"
          disabled={!subjectId || !classLevelId || !curriculumVersionId}
          onClick={() => {
            setEditing(null);
            setFormKey((k) => k + 1);
            setSheetOpen(true);
          }}
        >
          <Plus className="size-4" />
          Add strand
        </Button>
      </div>

      <StrandEditSheet
        key={formKey}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        editing={editing}
        subjectId={subjectId}
        classLevelId={classLevelId}
        curriculumVersionId={curriculumVersionId}
        onSaved={(saved, wasEdit) => {
          setStrandsByKey((prev) => {
            const list = prev[selectionKey] ?? [];
            const updated = wasEdit ? list.map((s) => (s.id === saved.id ? saved : s)) : [...list, saved];
            return { ...prev, [selectionKey]: updated };
          });
        }}
      />
    </div>
  );
}

"use client";

import { useState } from "react";
import { AlertCircle, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export interface CrudField {
  key: string;
  label: string;
  type: "text" | "number" | "select";
  required?: boolean;
  options?: { value: string; label: string }[];
}

export interface CrudRow {
  id: string;
  [key: string]: unknown;
}

/**
 * Shared list+create+edit+delete UI for the flat, single-level curriculum
 * entities (Subjects, Class Levels, Curriculum Versions) — the fields
 * differ but the interaction shape doesn't, so this is reused three times
 * instead of three near-identical hand-rolled components.
 */
export function FlatCrudManager({
  title,
  apiPath,
  fields,
  initialItems,
  columns,
  rowLabelKey,
}: {
  title: string;
  apiPath: string;
  fields: CrudField[];
  initialItems: CrudRow[];
  columns: { key: string; label: string }[];
  /**
   * Field name used for the delete-confirmation label. A plain key rather
   * than a `(row) => string` callback — this component is rendered from a
   * Server Component page, and function props can't cross that boundary.
   */
  rowLabelKey: string;
}) {
  const [items, setItems] = useState<CrudRow[]>(initialItems);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<CrudRow | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function openCreate() {
    setEditing(null);
    const initial: Record<string, string> = {};
    for (const f of fields) initial[f.key] = f.options?.[0]?.value ?? "";
    setValues(initial);
    setError(null);
    setSheetOpen(true);
  }

  function openEdit(row: CrudRow) {
    setEditing(row);
    const initial: Record<string, string> = {};
    for (const f of fields) initial[f.key] = String(row[f.key] ?? "");
    setValues(initial);
    setError(null);
    setSheetOpen(true);
  }

  function buildPayload(): Record<string, unknown> {
    const payload: Record<string, unknown> = {};
    for (const f of fields) {
      const raw = (values[f.key] ?? "").trim();
      if (f.type === "number") {
        payload[f.key] = raw === "" ? undefined : Number(raw);
      } else {
        payload[f.key] = raw;
      }
    }
    return payload;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      const payload = buildPayload();
      const res = await fetch(editing ? `${apiPath}/${editing.id}` : apiPath, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(body?.error?.message ?? "Save failed.");
      }
      const saved = body.data as CrudRow;
      setItems((prev) =>
        editing ? prev.map((it) => (it.id === saved.id ? saved : it)) : [...prev, saved],
      );
      setSheetOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(row: CrudRow) {
    if (!window.confirm(`Delete "${String(row[rowLabelKey] ?? "")}"? This can't be undone.`)) return;
    setDeletingId(row.id);
    setError(null);
    try {
      const res = await fetch(`${apiPath}/${row.id}`, { method: "DELETE" });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(body?.error?.message ?? "Delete failed.");
      }
      setItems((prev) => prev.filter((it) => it.id !== row.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          Add
        </Button>
      </div>

      {error && !sheetOpen ? (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Card className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b text-xs text-muted-foreground">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className="px-4 py-2 font-medium">
                  {c.label}
                </th>
              ))}
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-6 text-center text-muted-foreground">
                  No items yet.
                </td>
              </tr>
            ) : (
              items.map((row) => (
                <tr key={row.id} className="border-b last:border-0">
                  {columns.map((c) => (
                    <td key={c.key} className="px-4 py-2">
                      {String(row[c.key] ?? "")}
                    </td>
                  ))}
                  <td className="px-4 py-2">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => openEdit(row)} aria-label="Edit">
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDelete(row)}
                        disabled={deletingId === row.id}
                        aria-label="Delete"
                      >
                        {deletingId === row.id ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Trash2 className="size-4" />
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editing ? `Edit ${title.replace(/s$/, "")}` : `Add ${title.replace(/s$/, "")}`}</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4 overflow-y-auto px-4">
            {fields.map((f) => (
              <div key={f.key} className="flex flex-col gap-1.5">
                <Label htmlFor={`field-${f.key}`}>
                  {f.label}
                  {f.required ? <span aria-hidden="true" className="text-destructive"> *</span> : null}
                </Label>
                {f.type === "select" ? (
                  <Select
                    value={values[f.key] ?? ""}
                    onValueChange={(v) => setValues((prev) => ({ ...prev, [f.key]: String(v) }))}
                  >
                    <SelectTrigger id={`field-${f.key}`} className="w-full">
                      <SelectValue>
                        {(current: string | null) =>
                          f.options?.find((opt) => opt.value === current)?.label ?? "Select..."
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {(f.options ?? []).map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id={`field-${f.key}`}
                    type={f.type === "number" ? "number" : "text"}
                    required={f.required}
                    value={values[f.key] ?? ""}
                    onChange={(e) => setValues((prev) => ({ ...prev, [f.key]: e.target.value }))}
                  />
                )}
              </div>
            ))}
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
    </div>
  );
}

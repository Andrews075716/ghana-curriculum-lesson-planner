"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface TagListInputProps {
  id: string;
  label: string;
  helpText?: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}

/** Reusable "add a line, see a list, remove a line" editor for simple text-list fields. */
export function TagListInput({
  id,
  label,
  helpText,
  values,
  onChange,
  placeholder = "Type and press Enter to add",
}: TagListInputProps) {
  const [draft, setDraft] = useState("");

  function commitDraft() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onChange([...values, trimmed]);
    setDraft("");
  }

  function removeAt(index: number) {
    onChange(values.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {helpText ? <p className="text-xs text-muted-foreground">{helpText}</p> : null}
      <div className="flex gap-2">
        <Input
          id={id}
          value={draft}
          placeholder={placeholder}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commitDraft();
            }
          }}
        />
        <Button type="button" variant="outline" size="icon" onClick={commitDraft}>
          <Plus className="size-4" />
          <span className="sr-only">Add</span>
        </Button>
      </div>
      {values.length > 0 ? (
        <ul className="flex flex-col gap-1.5">
          {values.map((value, index) => (
            <li
              key={`${value}-${index}`}
              className="flex items-start justify-between gap-2 rounded-md border bg-muted/40 px-2.5 py-1.5 text-sm"
            >
              <span className="min-w-0 flex-1 text-pretty">{value}</span>
              <button
                type="button"
                onClick={() => removeAt(index)}
                aria-label={`Remove "${value}"`}
                className="shrink-0 text-muted-foreground hover:text-destructive"
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

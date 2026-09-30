"use client";

import { AlertCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurriculumOptions } from "@/hooks/useCurriculumOptions";
import type { CrossCuttingThemeDraft } from "./types";

export interface CrossCuttingThemesFieldProps {
  value: CrossCuttingThemeDraft[];
  onChange: (value: CrossCuttingThemeDraft[]) => void;
}

/**
 * Selecting a theme is only step one — each selected theme also gets its own
 * explanation of how it's incorporated into this lesson. Never a bare
 * checkbox list.
 */
export function CrossCuttingThemesField({ value, onChange }: CrossCuttingThemesFieldProps) {
  const { options, status, errorMessage } = useCurriculumOptions("/api/cross-cutting-themes");

  function toggle(themeId: string, checked: boolean) {
    if (checked) {
      onChange([...value, { themeId, explanation: "" }]);
    } else {
      onChange(value.filter((v) => v.themeId !== themeId));
    }
  }

  function updateExplanation(themeId: string, explanation: string) {
    onChange(value.map((v) => (v.themeId === themeId ? { ...v, explanation } : v)));
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label>Cross-Cutting Themes</Label>
      <p className="text-xs text-muted-foreground">
        Select every theme this lesson addresses, then explain how each one is incorporated.
      </p>
      {status === "loading" ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-5 w-48" />
        </div>
      ) : status === "error" ? (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-2.5 py-1.5 text-sm text-destructive"
        >
          <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
          <span>{errorMessage ?? "Failed to load themes."}</span>
        </div>
      ) : options.length === 0 ? (
        <p className="text-sm text-muted-foreground">No cross-cutting themes are available yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {options.map((option) => {
            const selection = value.find((v) => v.themeId === option.id);
            const checked = selection !== undefined;
            const fieldId = `theme-${option.id}`;
            return (
              <div key={option.id} className="rounded-md border p-2.5">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={fieldId}
                    checked={checked}
                    onCheckedChange={(next) => toggle(option.id, next === true)}
                  />
                  <Label htmlFor={fieldId} className="font-normal">
                    {option.label}
                  </Label>
                </div>
                {checked ? (
                  <div className="mt-2 flex flex-col gap-1">
                    <Label htmlFor={`${fieldId}-explanation`} className="text-xs font-normal text-muted-foreground">
                      How is this incorporated into the lesson?
                    </Label>
                    <Textarea
                      id={`${fieldId}-explanation`}
                      rows={2}
                      value={selection.explanation}
                      onChange={(event) => updateExplanation(option.id, event.target.value)}
                      placeholder="e.g. Learners collaborate in mixed-gender pairs to encourage equal participation"
                    />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

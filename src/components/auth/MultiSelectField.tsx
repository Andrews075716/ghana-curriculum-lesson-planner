"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

export interface MultiSelectFieldProps {
  label: string;
  helpText?: string;
  options: { id: string; label: string }[];
  value: string[];
  onChange: (value: string[]) => void;
  loading?: boolean;
}

/** A checkbox list for picking several curriculum options — subjects or class levels a teacher teaches. */
export function MultiSelectField({
  label,
  helpText,
  options,
  value,
  onChange,
  loading,
}: MultiSelectFieldProps) {
  function toggle(id: string, checked: boolean) {
    onChange(checked ? [...value, id] : value.filter((v) => v !== id));
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {helpText ? <p className="text-xs text-muted-foreground">{helpText}</p> : null}
      {loading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-40" />
        </div>
      ) : options.length === 0 ? (
        <p className="text-sm text-muted-foreground">No options available yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {options.map((option) => {
            const checked = value.includes(option.id);
            const fieldId = `multiselect-${option.id}`;
            return (
              <div
                key={option.id}
                className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 transition-colors ${
                  checked ? "border-[#006B3F] bg-[#006B3F]/5" : "border-input"
                }`}
              >
                <Checkbox
                  id={fieldId}
                  checked={checked}
                  onCheckedChange={(next) => toggle(option.id, next === true)}
                  className="data-checked:border-[#006B3F] data-checked:bg-[#006B3F]"
                />
                <Label htmlFor={fieldId} className="font-normal">
                  {option.label}
                </Label>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

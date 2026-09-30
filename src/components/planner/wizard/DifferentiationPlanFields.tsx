"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DIFFERENTIATION_FIELDS } from "@/lib/constants/planner-wizard";
import type { DifferentiationDraft } from "./types";

export interface DifferentiationPlanFieldsProps {
  value: DifferentiationDraft;
  onChange: (value: DifferentiationDraft) => void;
}

/**
 * Differentiation is intentionally 7 separate, independently-planned
 * dimensions rather than one free-text note or a single checkbox.
 */
export function DifferentiationPlanFields({ value, onChange }: DifferentiationPlanFieldsProps) {
  function update(key: keyof DifferentiationDraft, next: string) {
    onChange({ ...value, [key]: next });
  }

  return (
    <div className="flex flex-col gap-3">
      {DIFFERENTIATION_FIELDS.map((field) => (
        <div key={field.key} className="flex flex-col gap-1.5">
          <Label htmlFor={`differentiation-${field.key}`}>{field.label}</Label>
          <Textarea
            id={`differentiation-${field.key}`}
            rows={2}
            value={value[field.key]}
            placeholder={field.placeholder}
            onChange={(event) => update(field.key, event.target.value)}
          />
        </div>
      ))}
    </div>
  );
}

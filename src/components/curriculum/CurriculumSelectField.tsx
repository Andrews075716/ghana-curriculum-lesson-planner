"use client";

import { AlertCircle, RotateCcw } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CurriculumOption, FetchStatus } from "@/hooks/useCurriculumOptions";

export interface CurriculumSelectFieldProps {
  id: string;
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: CurriculumOption[];
  status: FetchStatus;
  errorMessage?: string | null;
  onRetry?: () => void;
  /** True while the parent level isn't selected yet, so this level has nothing to fetch. */
  disabled?: boolean;
  disabledMessage?: string;
  emptyMessage: string;
  /** Shown when the user tried to proceed without completing this field. */
  validationError?: string;
}

export function CurriculumSelectField({
  id,
  label,
  value,
  onValueChange,
  options,
  status,
  errorMessage,
  onRetry,
  disabled,
  disabledMessage,
  emptyMessage,
  validationError,
}: CurriculumSelectFieldProps) {
  const hintId = `${id}-hint`;

  let body: React.ReactNode;

  if (disabled) {
    body = (
      <Select disabled value={null}>
        <SelectTrigger id={id} className="w-full" aria-describedby={hintId}>
          <SelectValue placeholder={disabledMessage ?? "Unavailable"} />
        </SelectTrigger>
      </Select>
    );
  } else if (status === "loading") {
    body = (
      <Skeleton
        role="status"
        aria-label={`Loading ${label.toLowerCase()} options`}
        className="h-8 w-full rounded-lg"
      />
    );
  } else if (status === "error") {
    body = (
      <div
        role="alert"
        className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-2.5 py-1.5 text-sm text-destructive"
      >
        <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
        <span className="flex-1">{errorMessage ?? "Failed to load."}</span>
        {onRetry ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onRetry}
            aria-label={`Retry loading ${label.toLowerCase()}`}
          >
            <RotateCcw className="size-3.5" />
          </Button>
        ) : null}
      </div>
    );
  } else if (status === "success" && options.length === 0) {
    body = (
      <p
        id={hintId}
        className="rounded-lg border border-dashed px-2.5 py-1.5 text-sm text-muted-foreground"
      >
        {emptyMessage}
      </p>
    );
  } else {
    body = (
      <Select
        // Always pass a real value (never `undefined`) so the component is
        // controlled from the first render — Base UI treats `undefined` as
        // "uncontrolled" and warns/misbehaves if a later render switches to
        // a real value once something is selected.
        value={value || null}
        onValueChange={(next) => {
          if (next) onValueChange(next);
        }}
      >
        <SelectTrigger
          id={id}
          className="w-full"
          aria-invalid={Boolean(validationError)}
          aria-describedby={validationError ? `${id}-error` : undefined}
        >
          <SelectValue>
            {(current: string | null) =>
              current
                ? (options.find((option) => option.id === current)?.label ?? current)
                : `Select ${label.toLowerCase()}`
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {body}
      {validationError ? (
        <p id={`${id}-error`} role="alert" className="text-xs text-destructive">
          {validationError}
        </p>
      ) : null}
    </div>
  );
}

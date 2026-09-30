"use client";

import { useState } from "react";
import { AlertCircle, Check, Loader2, RotateCcw, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface AIAssistPanelProps<T> {
  /** Section name shown in the panel header, e.g. "Essential Questions". */
  label: string;
  /** Calls the AI action route and resolves the validated suggestion. */
  fetchSuggestion: () => Promise<T>;
  /** Whether the field already has teacher-entered content — gates the append/replace/cancel prompt. */
  hasExistingContent: boolean;
  /** Renders a read-only preview of the (not-yet-applied) suggestion. */
  renderPreview: (suggestion: T) => React.ReactNode;
  /** Merges the suggestion onto existing content without discarding it. */
  onAppend: (suggestion: T) => void;
  /** Replaces existing content with the suggestion outright. */
  onReplace: (suggestion: T) => void;
}

type Status = "idle" | "loading" | "preview" | "confirm" | "error";

/**
 * The one AI-assist UI used beside every AI-eligible wizard field. A
 * suggestion is never written into wizard state the moment it arrives —
 * it sits in a local preview until the teacher explicitly clicks Insert,
 * and if the field already has content, Insert asks Append/Replace/Cancel
 * first. Nothing here can overwrite teacher-written content on its own.
 */
export function AIAssistPanel<T>({
  label,
  fetchSuggestion,
  hasExistingContent,
  renderPreview,
  onAppend,
  onReplace,
}: AIAssistPanelProps<T>) {
  const [status, setStatus] = useState<Status>("idle");
  const [suggestion, setSuggestion] = useState<T | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function generate() {
    setStatus("loading");
    setErrorMessage(null);
    try {
      const result = await fetchSuggestion();
      setSuggestion(result);
      setStatus("preview");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to generate a suggestion.");
      setStatus("error");
    }
  }

  function discard() {
    setSuggestion(null);
    setStatus("idle");
  }

  function handleInsertClick() {
    if (suggestion === null) return;
    if (hasExistingContent) {
      setStatus("confirm");
    } else {
      onReplace(suggestion);
      discard();
    }
  }

  function confirmAppend() {
    if (suggestion !== null) onAppend(suggestion);
    discard();
  }

  function confirmReplace() {
    if (suggestion !== null) onReplace(suggestion);
    discard();
  }

  return (
    <div className="rounded-lg border border-dashed border-primary/30 bg-primary/[0.03] p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
          <Sparkles className="size-3.5" />
          AI Assist — {label}
        </div>
        {status === "idle" || status === "error" ? (
          <Button type="button" variant="outline" size="sm" onClick={generate}>
            <Sparkles className="size-3.5" />
            Generate
          </Button>
        ) : null}
      </div>

      {status === "loading" ? (
        <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Generating suggestion…
        </div>
      ) : null}

      {status === "error" && errorMessage ? (
        <p role="alert" className="mt-2 flex items-center gap-1.5 text-sm text-destructive">
          <AlertCircle className="size-3.5 shrink-0" />
          {errorMessage}
        </p>
      ) : null}

      {(status === "preview" || status === "confirm") && suggestion !== null ? (
        <div className="mt-2 flex flex-col gap-2">
          <div className="rounded-md border bg-card p-2.5 text-sm">{renderPreview(suggestion)}</div>

          {status === "preview" ? (
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" size="sm" onClick={handleInsertClick}>
                <Check className="size-3.5" />
                Insert
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={generate}>
                <RotateCcw className="size-3.5" />
                Regenerate
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={discard}>
                <Trash2 className="size-3.5" />
                Discard
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 rounded-md border border-amber-300 bg-amber-50 p-2.5 dark:border-amber-900 dark:bg-amber-950/30">
              <p className="text-xs text-foreground">
                This section already has content. What would you like to do with the suggestion?
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" size="sm" onClick={confirmAppend}>
                  Append
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={confirmReplace}>
                  Replace
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setStatus("preview")}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type AutosaveStatus = "idle" | "saving" | "saved" | "error";

export interface UseAutosaveResult {
  status: AutosaveStatus;
  isDirty: boolean;
  errorMessage: string | null;
  /** Saves immediately, bypassing the debounce — call before leaving a step. */
  flush: () => Promise<void>;
}

/**
 * Debounced autosave: calls `save(value)` `delayMs` after the last change.
 * "Dirty" is determined by comparing against the last successfully-saved
 * snapshot, tracked as state (read during render) rather than a ref — refs
 * are only touched inside effects/callbacks, never during render itself. A
 * change that arrives while a save is already in flight is coalesced into
 * one more save afterward, rather than dropped.
 */
export function useAutosave<T>(
  value: T,
  save: (value: T) => Promise<void>,
  delayMs = 1500,
): UseAutosaveResult {
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastSavedSnapshot, setLastSavedSnapshot] = useState(() => JSON.stringify(value));

  const valueRef = useRef(value);
  const savingRef = useRef(false);
  const pendingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const isDirty = JSON.stringify(value) !== lastSavedSnapshot;

  const runSave = useCallback(async () => {
    if (savingRef.current) {
      pendingRef.current = true;
      return;
    }
    savingRef.current = true;

    // Loop instead of recursing: a change that arrives mid-save sets
    // pendingRef, which triggers one more pass here rather than a nested
    // self-call.
    let keepGoing = true;
    while (keepGoing) {
      keepGoing = false;
      setStatus("saving");
      setErrorMessage(null);
      const snapshotBeingSaved = JSON.stringify(valueRef.current);
      try {
        await save(valueRef.current);
        setLastSavedSnapshot(snapshotBeingSaved);
        setStatus("saved");
      } catch (error) {
        setStatus("error");
        setErrorMessage(error instanceof Error ? error.message : "Failed to save.");
      }
      if (pendingRef.current) {
        pendingRef.current = false;
        keepGoing = true;
      }
    }

    savingRef.current = false;
  }, [save]);

  useEffect(() => {
    if (!isDirty) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      runSave();
    }, delayMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isDirty, delayMs, runSave]);

  const flush = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    await runSave();
  }, [runSave]);

  return { status, isDirty, errorMessage, flush };
}

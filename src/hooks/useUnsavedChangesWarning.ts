"use client";

import { useEffect } from "react";

/**
 * Warns before the user loses unsaved work:
 * - a native browser prompt on tab close / refresh / typed navigation
 *   (`beforeunload`);
 * - a confirm-then-navigate intercept for in-app link clicks, since the
 *   Next.js App Router has no built-in "block navigation" API.
 */
export function useUnsavedChangesWarning(
  isDirty: boolean,
  message = "You have unsaved changes. Leave this page anyway?",
) {
  useEffect(() => {
    if (!isDirty) return;

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }

    function handleClick(event: MouseEvent) {
      const target = (event.target as HTMLElement | null)?.closest("a[href]");
      if (!target) return;
      const href = target.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      if (!window.confirm(message)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("click", handleClick, true);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("click", handleClick, true);
    };
  }, [isDirty, message]);
}

"use client";

import { useCallback, useEffect, useState } from "react";

export interface CurriculumOption {
  id: string;
  label: string;
}

export type FetchStatus = "idle" | "loading" | "success" | "error";

interface FetchResult {
  requestKey: string;
  options: CurriculumOption[];
  status: "success" | "error";
  errorMessage: string | null;
}

export interface UseCurriculumOptionsResult {
  options: CurriculumOption[];
  status: FetchStatus;
  errorMessage: string | null;
  refetch: () => void;
}

/**
 * Fetches one level of the curriculum picker from `url`. Pass `null` when
 * the parent selection isn't made yet — the level stays idle rather than
 * fetching. Stale responses (from a `url`/retry that changed before the
 * previous request finished) are cancelled via AbortController.
 *
 * `status` is derived by comparing the latest completed result's request
 * key to the current one, rather than set synchronously inside the effect —
 * that way a URL change shows "loading" immediately with no extra render,
 * and every setState call happens inside a real async continuation.
 */
export function useCurriculumOptions(url: string | null): UseCurriculumOptionsResult {
  const [result, setResult] = useState<FetchResult | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    if (!url) return;

    const controller = new AbortController();
    const requestKey = `${url}::${retryToken}`;

    fetch(url, { signal: controller.signal })
      .then(async (res) => {
        const body = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(body?.error?.message ?? `Request failed (${res.status}).`);
        }
        return (body?.data ?? []) as CurriculumOption[];
      })
      .then((data) => {
        setResult({ requestKey, options: data, status: "success", errorMessage: null });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setResult({
          requestKey,
          options: [],
          status: "error",
          errorMessage:
            error instanceof Error ? error.message : "Failed to load options.",
        });
      });

    return () => controller.abort();
  }, [url, retryToken]);

  const refetch = useCallback(() => setRetryToken((t) => t + 1), []);

  if (!url) {
    return { options: [] as CurriculumOption[], status: "idle" as FetchStatus, errorMessage: null as string | null, refetch };
  }

  const currentRequestKey = `${url}::${retryToken}`;
  if (!result || result.requestKey !== currentRequestKey) {
    return { options: [] as CurriculumOption[], status: "loading" as FetchStatus, errorMessage: null as string | null, refetch };
  }

  return {
    options: result.options,
    status: result.status as FetchStatus,
    errorMessage: result.errorMessage,
    refetch,
  };
}

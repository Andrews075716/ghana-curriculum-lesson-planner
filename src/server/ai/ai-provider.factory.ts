import type { AIProvider } from "./ai-provider.interface";

/**
 * Resolves the configured `AIProvider` from `env.AI_PROVIDER`.
 *
 * "none" (the default — see .env.example) resolves to `NoopAIProvider`.
 * "anthropic" resolves to `AnthropicAIProvider`, which in turn checks
 * `ANTHROPIC_API_KEY` and reports itself disabled (not a crash) if that's
 * missing — see `AnthropicAIProvider.isEnabled()`.
 *
 * Providers are imported dynamically inside their case, not statically at
 * the top of this file. Two reasons: a provider module (like Anthropic's)
 * can carry real server-only guarantees (`import "server-only"`) and SDK
 * weight that should only load when actually selected — a static import
 * would pull the Anthropic SDK into every bundle/runtime regardless of
 * `AI_PROVIDER`.
 *
 * Adding another vendor later means adding a `providers/<name>-ai-provider.ts`
 * that implements `AIProvider` and a case below — nothing in
 * `ai.service.ts` or above it needs to change.
 *
 * "mock" is a third, TEST-ONLY option (see `providers/mock-ai-provider.ts`)
 * — deterministic, zero-cost, no network call — for tests that need to
 * exercise the real `ai.service.ts` pipeline (schema + semantic
 * validation) without a live Anthropic call. Refused outright when
 * `NODE_ENV=production`, falling back to the noop provider instead, so a
 * stray `AI_PROVIDER=mock` in a real deployment's environment can never
 * silently serve canned fake lesson content to a teacher.
 */
export async function getAIProvider(): Promise<AIProvider> {
  const configured = process.env.AI_PROVIDER?.trim().toLowerCase() || "none";

  switch (configured) {
    case "anthropic": {
      const { AnthropicAIProvider } = await import("./providers/anthropic-ai-provider");
      return new AnthropicAIProvider();
    }
    case "mock": {
      if (process.env.NODE_ENV === "production") {
        const { NoopAIProvider } = await import("./providers/noop-ai-provider");
        return new NoopAIProvider();
      }
      const { MockAIProvider } = await import("./providers/mock-ai-provider");
      return new MockAIProvider();
    }
    case "none":
    default: {
      // Unrecognized values fail safe to the noop provider rather than
      // throwing, so a typo in .env can't take the whole app down.
      const { NoopAIProvider } = await import("./providers/noop-ai-provider");
      return new NoopAIProvider();
    }
  }
}

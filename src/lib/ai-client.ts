"use client";

/**
 * Thin client-side fetch wrapper for `/api/planners/[id]/ai/[action]`. No
 * business logic lives here — it just calls the route and unwraps the
 * `{ suggestion, meta }` envelope or throws a readable error message
 * (from the API's `{ error: { message } }` shape) for the caller to show.
 */
export type AIActionName =
  | "essential-questions"
  | "pedagogical-strategies"
  | "teaching-learning-resources"
  | "differentiation"
  | "pedagogical-exemplars"
  | "lesson-activities"
  | "assessments"
  | "closure"
  | "full-lesson-draft";

export interface AISuggestionResponse<T> {
  suggestion: T;
  meta: { provider: string; generatedAt: string };
}

/**
 * Teacher-facing copy for each server error code. Deliberately generic for
 * the "ops problem" codes (AI_UNAVAILABLE covers both "no provider
 * configured" and "the provider rejected the API key" — a teacher can't
 * fix either, so there's no value in surfacing which one) — never the raw
 * `error.message`, which can contain configuration detail like an env var
 * name (see NoopAIProvider.getStatusMessage()). VALIDATION_ERROR is the
 * one exception: those messages ("Select a Learning Indicator before
 * requesting AI suggestions") are already written for a teacher, not a
 * developer, so they pass through as-is.
 */
const FRIENDLY_AI_ERROR: Partial<Record<string, string>> = {
  AI_UNAVAILABLE: "AI Assist isn't available right now. You can still fill in this section yourself.",
  AI_RATE_LIMITED: "AI Assist is busy right now. Please try again in a few minutes.",
  AI_TIMEOUT: "The AI took too long to respond. Please try again.",
  AI_REQUEST_FAILED: "Couldn't reach the AI service right now. Please try again shortly.",
  AI_INVALID_OUTPUT: "The AI's suggestion couldn't be used. Please try regenerating.",
  FORBIDDEN: "You need to be signed in to use AI Assist.",
  NOT_FOUND: "This planner couldn't be found.",
};

/** Thrown by `requestAISuggestion` — carries the server's error `code` alongside a teacher-friendly message. */
export class AIAssistError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "AIAssistError";
    this.code = code;
  }
}

export async function requestAISuggestion<T>(
  plannerId: string,
  action: AIActionName,
  options?: { count?: number; reflectionSourceLessonId?: string | null },
): Promise<AISuggestionResponse<T>> {
  const requestBody: { count?: number; reflectionSourceLessonId?: string } = {};
  if (options?.count !== undefined) requestBody.count = options.count;
  if (options?.reflectionSourceLessonId) {
    requestBody.reflectionSourceLessonId = options.reflectionSourceLessonId;
  }

  const res = await fetch(`/api/planners/${plannerId}/ai/${action}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });
  const responseBody = await res.json().catch(() => null);
  if (!res.ok) {
    const code: string = responseBody?.error?.code ?? "UNKNOWN";
    const rawMessage: string | undefined = responseBody?.error?.message;
    const message =
      code === "VALIDATION_ERROR"
        ? (rawMessage ?? "Please complete the required fields before requesting a suggestion.")
        : (FRIENDLY_AI_ERROR[code] ?? "Something went wrong generating a suggestion. Please try again.");
    throw new AIAssistError(code, message);
  }
  return responseBody.data as AISuggestionResponse<T>;
}

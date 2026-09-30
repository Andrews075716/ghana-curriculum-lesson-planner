import { NextResponse } from "next/server";
import { AIActivityDurationExceededError, AppError, RateLimitedError } from "./app-error";

/** Maps a thrown error to the API's consistent `{ error: { code, message } }` shape. */
export function handleRouteError(error: unknown): NextResponse {
  if (error instanceof RateLimitedError) {
    return NextResponse.json(
      { error: { code: error.code, message: error.message } },
      { status: error.httpStatus, headers: { "Retry-After": String(error.retryAfterSeconds) } },
    );
  }

  if (error instanceof AIActivityDurationExceededError) {
    // expectedDuration/generatedDuration/difference are safe, teacher-meaningful
    // numbers (the planner's own configured duration and what the AI proposed)
    // — never provider internals — so unlike other 5xx AppErrors they're
    // included directly in the response body, not just server logs.
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          details: {
            expectedDuration: error.expectedDuration,
            generatedDuration: error.generatedDuration,
            difference: error.difference,
          },
        },
      },
      { status: error.httpStatus },
    );
  }

  if (error instanceof AppError) {
    // Log server-side detail for anything in the 5xx range (includes every
    // AI_* code: unavailable/invalid-output/timeout/request-failed) so a
    // developer can see *why* — e.g. "ANTHROPIC_API_KEY is not set" or the
    // raw Anthropic API error — without that detail ever reaching the
    // response body. Never logs the API key itself: `error.message` here
    // comes from our own AppError subclasses (see app-error.ts) or the
    // Anthropic SDK's error message, neither of which echoes request
    // credentials back.
    if (error.httpStatus >= 500) {
      const tag = error.category ? `[${error.code}/${error.category}]` : `[${error.code}]`;
      console.error(tag, error.message, error.cause ?? "");
    }
    return NextResponse.json(
      { error: { code: error.code, message: error.message } },
      { status: error.httpStatus },
    );
  }

  console.error(error);
  return NextResponse.json(
    { error: { code: "INTERNAL", message: "Something went wrong." } },
    { status: 500 },
  );
}

import { ErrorCode } from "./error-codes";

/**
 * Base error type for the service layer. Route handlers/Server Actions
 * catch this and map it to a consistent JSON error response.
 */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly httpStatus: number;
  /**
   * Optional, finer-grained diagnostic tag than `code` — e.g. an
   * `AIUnavailableError` is the same public `code` (AI_UNAVAILABLE) whether
   * the provider was never configured or a real API call rejected the
   * key, but those are very different things to debug. Never sent to the
   * client (see `handle-route-error.ts`); server logs only.
   */
  readonly category?: string;

  constructor(
    code: ErrorCode,
    message: string,
    httpStatus: number,
    options?: { cause?: unknown; category?: string },
  ) {
    super(message, options);
    this.name = "AppError";
    this.code = code;
    this.httpStatus = httpStatus;
    this.category = options?.category;
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found", options?: { cause?: unknown }) {
    super(ErrorCode.NOT_FOUND, message, 404, options);
  }
}

export class ValidationError extends AppError {
  constructor(message = "Invalid input", options?: { cause?: unknown }) {
    super(ErrorCode.VALIDATION_ERROR, message, 400, options);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Not allowed", options?: { cause?: unknown }) {
    super(ErrorCode.FORBIDDEN, message, 403, options);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflict", options?: { cause?: unknown }) {
    super(ErrorCode.CONFLICT, message, 409, options);
  }
}

/** Too many requests from this caller in the current window. */
export class RateLimitedError extends AppError {
  readonly retryAfterSeconds: number;

  constructor(retryAfterSeconds: number, message = "Too many requests. Please try again shortly.") {
    super(ErrorCode.RATE_LIMITED, message, 429);
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

type AIErrorOptions = { cause?: unknown; category?: string };

/** No provider configured, or the configured provider is missing credentials. */
export class AIUnavailableError extends AppError {
  constructor(message = "AI assistance is not available.", options?: AIErrorOptions) {
    super(ErrorCode.AI_UNAVAILABLE, message, 503, options);
  }
}

/** The model's response didn't parse as valid JSON, or failed schema validation. Never persisted. */
export class AIInvalidOutputError extends AppError {
  constructor(message = "The AI response was not in the expected format.", options?: AIErrorOptions) {
    super(ErrorCode.AI_INVALID_OUTPUT, message, 502, {
      category: "AI_RESPONSE_VALIDATION_ERROR",
      ...options,
    });
  }
}

/** The AI provider's rate limit was hit. */
export class AIRateLimitError extends AppError {
  constructor(message = "The AI provider is rate-limited. Please try again shortly.", options?: AIErrorOptions) {
    super(ErrorCode.AI_RATE_LIMITED, message, 429, { category: "AI_RATE_LIMIT_ERROR", ...options });
  }
}

/** The request to the AI provider timed out. */
export class AITimeoutError extends AppError {
  constructor(message = "The AI provider took too long to respond.", options?: AIErrorOptions) {
    super(ErrorCode.AI_TIMEOUT, message, 504, { category: "AI_NETWORK_ERROR", ...options });
  }
}

/** Network failure, or any other non-2xx response from the AI provider. */
export class AIRequestError extends AppError {
  constructor(message = "The request to the AI provider failed.", options?: AIErrorOptions) {
    super(ErrorCode.AI_REQUEST_FAILED, message, 502, { category: "AI_PROVIDER_ERROR", ...options });
  }
}

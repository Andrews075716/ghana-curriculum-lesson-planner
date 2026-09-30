import { NextResponse } from "next/server";
import type { ZodType } from "zod";

type ParseQueryResult<T> =
  | { success: true; data: T }
  | { success: false; response: NextResponse };

/** Validates a Route Handler's query string against a Zod schema, or returns a 400 response to short-circuit with. */
export function parseQuery<T>(
  schema: ZodType<T>,
  searchParams: URLSearchParams,
): ParseQueryResult<T> {
  const raw = Object.fromEntries(searchParams.entries());
  const result = schema.safeParse(raw);

  if (!result.success) {
    return {
      success: false,
      response: NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid query parameters.",
            fieldErrors: result.error.flatten().fieldErrors,
          },
        },
        { status: 400 },
      ),
    };
  }

  return { success: true, data: result.data };
}

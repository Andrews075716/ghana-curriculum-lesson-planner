import { NextResponse } from "next/server";
import { ForbiddenError, ValidationError } from "@/server/errors/app-error";
import { handleRouteError } from "@/server/errors/handle-route-error";
import { getCurrentTeacherId } from "@/server/auth/session";
import { enforceRateLimit } from "@/server/api/rate-limit";
import { AIGenerationOptionsSchema, type AIGenerationOptions } from "@/lib/validation/ai.schema";
import * as aiService from "@/server/services/ai.service";

/**
 * `POST /api/planners/[id]/ai/[action]` — the one HTTP surface for every
 * AI-assisted suggestion in the wizard. `[action]` is one of the keys
 * below, each mapped 1:1 to a `ai.service.ts` function; nothing here
 * bypasses that service layer's context-resolution or output validation.
 *
 * Body (optional): `{ "count"?: number, "reflectionSourceLessonId"?: string }`
 * — `count` only affects the list-generating actions; `reflectionSourceLessonId`
 * applies uniformly (folded into the curriculum context every method
 * receives) and, if present, must be a lesson the requesting teacher owns.
 */
const ACTIONS = {
  "essential-questions": aiService.generateEssentialQuestions,
  "pedagogical-strategies": aiService.generatePedagogicalStrategies,
  "teaching-learning-resources": aiService.generateTeachingLearningResources,
  differentiation: aiService.generateDifferentiation,
  "pedagogical-exemplars": aiService.generatePedagogicalExemplars,
  "lesson-activities": aiService.generateLessonActivities,
  assessments: aiService.generateAssessments,
  closure: aiService.generateClosure,
  "full-lesson-draft": aiService.generateFullLessonDraft,
} as const satisfies Record<
  string,
  (
    plannerId: string,
    teacherId: string,
    options?: AIGenerationOptions,
  ) => Promise<{ suggestion: unknown }>
>;

type ActionName = keyof typeof ACTIONS;

function isKnownAction(action: string): action is ActionName {
  return Object.hasOwn(ACTIONS, action);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; action: string }> },
) {
  const { id, action } = await params;
  try {
    if (!isKnownAction(action)) {
      throw new ValidationError(`Unknown AI action "${action}".`);
    }

    const teacherId = await getCurrentTeacherId();
    if (!teacherId) throw new ForbiddenError("No teacher session available.");

    // Cost control on a paid, external API — generous enough for normal
    // wizard use (8 sections, occasional regenerate) but bounds runaway
    // spend from a bug or a teacher spamming "Regenerate".
    enforceRateLimit(request, "ai-action", {
      perIp: { limit: 60, windowMs: 10 * 60_000 },
      perKey: { key: teacherId, limit: 30, windowMs: 10 * 60_000 },
    });

    const body = await request
      .json()
      .catch(() => ({}) as unknown);
    const parsedOptions = AIGenerationOptionsSchema.safeParse(body ?? {});
    if (!parsedOptions.success) {
      throw new ValidationError("Invalid request body.", { cause: parsedOptions.error });
    }

    const result = await ACTIONS[action](id, teacherId, parsedOptions.data);
    return NextResponse.json({ data: result });
  } catch (error) {
    return handleRouteError(error);
  }
}

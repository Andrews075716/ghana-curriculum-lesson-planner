import { AIActivityDurationExceededError } from "@/server/errors/app-error";
import type { LessonActivityInput } from "@/lib/validation/planner.schema";

/**
 * Semantic validation of AI-generated lesson-activity timing — the layer
 * between schema validation and teacher review described in
 * docs/checkpoint-8-ai-integration.md's architecture diagram:
 *
 *   structured response -> Zod/schema validation -> semantic validation -> teacher review
 *
 * `LessonActivityInputSchema` (planner.schema.ts, reused by the AI output
 * schemas) already rejects a zero, negative, or non-numeric
 * `durationMinutes` per activity (`z.number().int().min(1).max(300)`) —
 * that's schema validation and this module doesn't repeat it. What schema
 * validation structurally cannot express is a cross-object check: whether
 * the SUM of a response's activity durations fits within the planner's own
 * `durationMinutes`, a value that lives on a different object entirely
 * (`AICurriculumContext`, not the suggestion being validated).
 *
 * THE RULE — evidenced, not invented: reject only OVER-allocation
 * (sum > durationMinutes); never reject under-allocation. This mirrors an
 * already-shipped product decision, not a new policy invented for AI output:
 *  - `LessonActivityListEditor.tsx` (the teacher-facing editor for this
 *    exact data) already computes `overPlanned = total > planned` and warns
 *    only in that direction — there is no corresponding "under-allocated"
 *    warning anywhere in the app today.
 *  - `generateLessonActivities`'s own prompt (anthropic-ai-provider.ts)
 *    explicitly asks for a total "noticeably less" than the full duration,
 *    since Lesson Closure is generated separately — under-allocation is
 *    that method's INTENDED normal output, not a defect.
 *  - No numeric tolerance for "how close to the full duration counts as
 *    close enough" exists anywhere in this codebase, so none is invented
 *    here; over-allocation is checked as a strict inequality instead, which
 *    needs no tolerance to justify (a lesson cannot literally contain more
 *    minutes than it has).
 *
 * Each `generate*` AI response is validated independently against the
 * planner's `durationMinutes` — never accumulated across multiple AI calls
 * or against a planner's other, already-saved activities (the AI service
 * layer has no visibility into existing wizard-state content by design;
 * merging AI output with existing content is the client's job, after
 * teacher review — see AIAssistPanel.tsx). This also naturally validates
 * "each lesson independently": a `LessonPlanner` has exactly one `Lesson`
 * row in every code path that creates one (`createDraftPlanner`, planner
 * duplication — verified by inspecting planner.repository.ts), and every
 * `generate*` call's `durationMinutes` already refers to that one lesson,
 * so there is no multi-lesson aggregation to get wrong today.
 */
export function assertActivityDurationsFit(
  activities: Pick<LessonActivityInput, "durationMinutes">[],
  expectedDurationMinutes: number,
  sectionLabel: string,
): void {
  const totalMinutes = activities.reduce((sum, activity) => sum + activity.durationMinutes, 0);
  if (totalMinutes > expectedDurationMinutes) {
    throw new AIActivityDurationExceededError(sectionLabel, expectedDurationMinutes, totalMinutes);
  }
}

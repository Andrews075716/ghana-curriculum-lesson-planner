import type { ZodError } from "zod";
import { Step1Schema, Step2Schema } from "@/lib/validation/planner.schema";
import type { WizardState } from "./types";

export interface StepValidationResult {
  valid: boolean;
  fieldErrors: Record<string, string>;
}

function toInt(value: string): number | undefined {
  if (value.trim() === "") return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function flatten(error: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

const VALID: StepValidationResult = { valid: true, fieldErrors: {} };

/**
 * Per-step gating for the "Next" button. Steps 1-2 are structurally
 * required (they identify what this planner is for). Steps 3-4 are
 * supplementary content with no hard requirements. Steps 5-6 allow
 * proceeding with zero entries, but any entry the teacher started must be
 * completed (or removed) before moving on. Full completeness for
 * publishing is enforced server-side regardless of this client-side gating.
 */
export function validateStep(step: number, state: WizardState): StepValidationResult {
  switch (step) {
    case 1: {
      const result = Step1Schema.safeParse({
        subjectId: state.subjectId,
        classLevelId: state.classLevelId,
        term: state.term || undefined,
        weekNumber: toInt(state.weekNumber),
        lessonNumber: toInt(state.lessonNumber),
        lessonDate: state.lessonDate || undefined,
        durationMinutes: toInt(state.durationMinutes),
      });
      return result.success ? VALID : { valid: false, fieldErrors: flatten(result.error) };
    }
    case 2: {
      const result = Step2Schema.safeParse({
        strandId: state.strandId,
        subStrandId: state.subStrandId,
        contentStandardId: state.contentStandardId,
        learningOutcomeId: state.learningOutcomeId,
        learningIndicatorId: state.learningIndicatorId,
      });
      return result.success ? VALID : { valid: false, fieldErrors: flatten(result.error) };
    }
    case 3: {
      const missingExplanation = state.crossCuttingThemes.some((t) => !t.explanation.trim());
      return missingExplanation
        ? {
            valid: false,
            fieldErrors: {
              crossCuttingThemes:
                "Explain how each selected cross-cutting theme is incorporated, or remove it.",
            },
          }
        : VALID;
    }
    case 5: {
      const incomplete = state.lessonActivities.some((a) => {
        const touched =
          a.label.trim() || a.teacherActivity.trim() || a.learnerActivity.trim() || a.durationMinutes.trim();
        if (!touched) return false;
        return !(a.label.trim() && a.teacherActivity.trim() && a.learnerActivity.trim() && a.durationMinutes.trim());
      });
      return incomplete
        ? {
            valid: false,
            fieldErrors: {
              lessonActivities: "Complete every field for each activity you've started, or remove it.",
            },
          }
        : VALID;
    }
    case 6: {
      const incompleteAssessment = state.assessments.some((a) => {
        const touched = a.dokLevel || a.description.trim();
        if (!touched) return false;
        return !(a.dokLevel && a.description.trim());
      });
      return incompleteAssessment
        ? {
            valid: false,
            fieldErrors: {
              assessments: "Complete every assessment you've started (DoK level and description), or remove it.",
            },
          }
        : VALID;
    }
    default:
      return VALID;
  }
}

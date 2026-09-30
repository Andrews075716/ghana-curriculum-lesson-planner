"use client";

import { LessonActivityListEditor } from "../LessonActivityListEditor";
import { AIAssistPanel } from "../ai/AIAssistPanel";
import { ActivitiesPreview, ActivityPreviewItem } from "../ai/previews";
import { requestAISuggestion } from "@/lib/ai-client";
import type { ClosureSuggestion, LessonActivitiesSuggestion } from "@/lib/validation/ai.schema";
import type { LessonActivityInput } from "@/lib/validation/planner.schema";
import { toLessonActivityDraft, type LessonActivityDraft, type WizardState } from "../types";

export interface Step5MainLessonProps {
  plannerId: string;
  state: WizardState;
  updateField: <K extends keyof WizardState>(key: K, value: WizardState[K]) => void;
  fieldErrors: Record<string, string>;
}

function hasActivityContent(activity: LessonActivityDraft): boolean {
  return (
    activity.teacherActivity.trim() !== "" ||
    activity.learnerActivity.trim() !== "" ||
    activity.durationMinutes.trim() !== ""
  );
}

export function Step5MainLesson({ plannerId, state, updateField, fieldErrors }: Step5MainLessonProps) {
  const plannedDurationMinutes = (() => {
    const parsed = Number.parseInt(state.durationMinutes, 10);
    return Number.isFinite(parsed) && state.durationMinutes.trim() !== "" ? parsed : null;
  })();

  const mainActivities = state.lessonActivities.filter((a) => a.stage !== "CLOSURE");
  const closureActivities = state.lessonActivities.filter((a) => a.stage === "CLOSURE");
  const closureRow = closureActivities[0] ?? null;

  const hasMainContent = mainActivities.some(hasActivityContent);
  const hasClosureContent = closureRow !== null && hasActivityContent(closureRow);

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        Build the full lesson flow — Starter through Lesson Closure — with what the teacher and
        learners do at each stage.
      </p>

      <AIAssistPanel<LessonActivityInput[]>
        label="Teacher/Learner Activities"
        hasExistingContent={hasMainContent}
        fetchSuggestion={async () => {
          const { suggestion } = await requestAISuggestion<LessonActivitiesSuggestion>(
            plannerId,
            "lesson-activities",
            { reflectionSourceLessonId: state.reflectionContextLessonId },
          );
          return suggestion.lessonActivities;
        }}
        renderPreview={(items) => <ActivitiesPreview items={items} />}
        onAppend={(items) =>
          updateField("lessonActivities", [
            ...mainActivities,
            ...items.map(toLessonActivityDraft),
            ...closureActivities,
          ])
        }
        onReplace={(items) =>
          updateField("lessonActivities", [...items.map(toLessonActivityDraft), ...closureActivities])
        }
      />

      <LessonActivityListEditor
        activities={state.lessonActivities}
        onChange={(activities) => updateField("lessonActivities", activities)}
        plannedDurationMinutes={plannedDurationMinutes}
      />
      {fieldErrors.lessonActivities ? (
        <p role="alert" className="text-sm text-destructive">
          {fieldErrors.lessonActivities}
        </p>
      ) : null}

      <AIAssistPanel<LessonActivityInput>
        label="Lesson Closure"
        hasExistingContent={hasClosureContent}
        fetchSuggestion={async () => {
          const { suggestion } = await requestAISuggestion<ClosureSuggestion>(plannerId, "closure", {
            reflectionSourceLessonId: state.reflectionContextLessonId,
          });
          return suggestion.closure;
        }}
        renderPreview={(closure) => <ActivityPreviewItem activity={closure} />}
        onAppend={(closure) => {
          if (closureRow) {
            const existingTeacher = closureRow.teacherActivity.trim();
            const existingLearner = closureRow.learnerActivity.trim();
            const merged: LessonActivityDraft = {
              ...closureRow,
              teacherActivity: existingTeacher
                ? `${existingTeacher}\n\n${closure.teacherActivity}`
                : closure.teacherActivity,
              learnerActivity: existingLearner
                ? `${existingLearner}\n\n${closure.learnerActivity}`
                : closure.learnerActivity,
              durationMinutes: String(closure.durationMinutes),
            };
            updateField("lessonActivities", [...mainActivities, merged]);
          } else {
            updateField("lessonActivities", [...mainActivities, toLessonActivityDraft(closure)]);
          }
        }}
        onReplace={(closure) =>
          updateField("lessonActivities", [...mainActivities, toLessonActivityDraft(closure)])
        }
      />
    </div>
  );
}

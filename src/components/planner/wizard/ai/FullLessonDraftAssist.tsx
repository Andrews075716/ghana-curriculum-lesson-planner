"use client";

import { AIAssistPanel } from "./AIAssistPanel";
import {
  ActivitiesPreview,
  AssessmentsPreview,
  DifferentiationPreview,
  StringListPreview,
} from "./previews";
import { requestAISuggestion } from "@/lib/ai-client";
import type { FullLessonDraftSuggestion } from "@/lib/validation/ai.schema";
import { toAssessmentDraft, toLessonActivityDraft, type WizardState } from "../types";

export interface FullLessonDraftAssistProps {
  plannerId: string;
  state: WizardState;
  updateField: <K extends keyof WizardState>(key: K, value: WizardState[K]) => void;
}

function hasAnyPlanningContent(state: WizardState): boolean {
  return (
    state.essentialQuestions.length > 0 ||
    state.pedagogicalStrategies.length > 0 ||
    Object.values(state.differentiation).some((v) => v.trim() !== "") ||
    state.lessonActivities.some((a) => a.label.trim() || a.teacherActivity.trim() || a.learnerActivity.trim()) ||
    state.assessments.length > 0
  );
}

/**
 * The one entry point for `generateFullLessonDraft` — fully implemented at
 * the service/provider/route layer (see ai.service.ts, ai-provider.interface.ts)
 * but, before this component, unreachable from any UI (a known,
 * pre-existing gap — see docs/checkpoint-8-ai-audit.md). Placed on Step 2
 * (Curriculum Alignment) — the first point in the wizard where curriculum
 * selection AND lesson duration (Step 1) are both already required, which
 * `resolveContextForPlanner` needs before it will generate anything.
 *
 * Reuses `AIAssistPanel` exactly like every single-field AI Assist button —
 * same Generate/Preview/Insert/Regenerate/Discard flow, same
 * Append/Replace/Cancel confirmation when content already exists — just
 * applied across all 5 sections a full draft covers at once, so a full
 * draft is never silently mixed into existing teacher-authored content any
 * more than a single-field suggestion is.
 */
export function FullLessonDraftAssist({ plannerId, state, updateField }: FullLessonDraftAssistProps) {
  return (
    <div className="rounded-lg border border-primary/20 bg-primary/[0.02] p-3">
      <p className="mb-2 text-xs text-muted-foreground">
        Once you&apos;re happy with the curriculum selection above, you can ask AI to draft the whole
        lesson at once (essential questions, pedagogical strategies, differentiation, the full
        lesson flow, and assessments) — or skip this and fill in each section yourself as you go
        through the next steps.
      </p>
      <AIAssistPanel<FullLessonDraftSuggestion>
        label="Full Lesson Draft"
        hasExistingContent={hasAnyPlanningContent(state)}
        fetchSuggestion={async () => {
          const { suggestion } = await requestAISuggestion<FullLessonDraftSuggestion>(
            plannerId,
            "full-lesson-draft",
            { reflectionSourceLessonId: state.reflectionContextLessonId },
          );
          return suggestion;
        }}
        renderPreview={(draft) => (
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Essential Questions</p>
              <StringListPreview items={draft.essentialQuestions} />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Pedagogical Strategies</p>
              <StringListPreview items={draft.pedagogicalStrategies} />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Differentiation</p>
              <DifferentiationPreview value={draft.differentiation} />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Lesson Flow (incl. Closure)</p>
              <ActivitiesPreview items={draft.lessonActivities} />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Assessments</p>
              <AssessmentsPreview items={draft.assessments} />
            </div>
          </div>
        )}
        onReplace={(draft) => {
          updateField("essentialQuestions", draft.essentialQuestions);
          updateField("pedagogicalStrategies", draft.pedagogicalStrategies);
          updateField("differentiation", draft.differentiation);
          updateField("lessonActivities", draft.lessonActivities.map(toLessonActivityDraft));
          updateField("assessments", draft.assessments.map(toAssessmentDraft));
        }}
        onAppend={(draft) => {
          updateField("essentialQuestions", [...state.essentialQuestions, ...draft.essentialQuestions]);
          updateField("pedagogicalStrategies", [
            ...state.pedagogicalStrategies,
            ...draft.pedagogicalStrategies,
          ]);
          // "Append" for a 7-field object means filling in only what's still
          // empty — a field the teacher already wrote something into is left
          // alone, same principle as the list fields above never dropping
          // existing entries.
          const mergedDifferentiation = { ...state.differentiation };
          for (const key of Object.keys(mergedDifferentiation) as Array<keyof typeof mergedDifferentiation>) {
            if (!mergedDifferentiation[key].trim() && draft.differentiation[key]) {
              mergedDifferentiation[key] = draft.differentiation[key];
            }
          }
          updateField("differentiation", mergedDifferentiation);
          updateField("lessonActivities", [
            ...state.lessonActivities,
            ...draft.lessonActivities.map(toLessonActivityDraft),
          ]);
          updateField("assessments", [...state.assessments, ...draft.assessments.map(toAssessmentDraft)]);
        }}
      />
    </div>
  );
}

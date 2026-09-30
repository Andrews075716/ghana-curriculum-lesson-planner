"use client";

import { AssessmentListEditor } from "../AssessmentListEditor";
import { AIAssistPanel } from "../ai/AIAssistPanel";
import { AssessmentsPreview } from "../ai/previews";
import { requestAISuggestion } from "@/lib/ai-client";
import type { AssessmentsSuggestion } from "@/lib/validation/ai.schema";
import type { AssessmentInput } from "@/lib/validation/planner.schema";
import { toAssessmentDraft, type WizardState } from "../types";

export interface Step6AssessmentProps {
  plannerId: string;
  state: WizardState;
  updateField: <K extends keyof WizardState>(key: K, value: WizardState[K]) => void;
  fieldErrors: Record<string, string>;
}

export function Step6Assessment({ plannerId, state, updateField, fieldErrors }: Step6AssessmentProps) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-foreground">
          Key Assessments (Depth of Knowledge)
        </p>
        <AIAssistPanel<AssessmentInput[]>
          label="DoK Assessments"
          hasExistingContent={state.assessments.length > 0}
          fetchSuggestion={async () => {
            const { suggestion } = await requestAISuggestion<AssessmentsSuggestion>(
              plannerId,
              "assessments",
              { reflectionSourceLessonId: state.reflectionContextLessonId },
            );
            return suggestion.assessments;
          }}
          renderPreview={(items) => <AssessmentsPreview items={items} />}
          onAppend={(items) =>
            updateField("assessments", [...state.assessments, ...items.map(toAssessmentDraft)])
          }
          onReplace={(items) => updateField("assessments", items.map(toAssessmentDraft))}
        />
        <AssessmentListEditor
          assessments={state.assessments}
          onChange={(assessments) => updateField("assessments", assessments)}
        />
        {fieldErrors.assessments ? (
          <p role="alert" className="text-sm text-destructive">
            {fieldErrors.assessments}
          </p>
        ) : null}
      </div>
    </div>
  );
}

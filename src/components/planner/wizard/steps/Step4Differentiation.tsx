"use client";

import { TagListInput } from "../TagListInput";
import { DifferentiationPlanFields } from "../DifferentiationPlanFields";
import { AIAssistPanel } from "../ai/AIAssistPanel";
import { DifferentiationPreview, StringListPreview } from "../ai/previews";
import { requestAISuggestion } from "@/lib/ai-client";
import { DIFFERENTIATION_FIELDS } from "@/lib/constants/planner-wizard";
import type {
  DifferentiationSuggestion,
  PedagogicalExemplarsSuggestion,
} from "@/lib/validation/ai.schema";
import type { DifferentiationPlanInput } from "@/lib/validation/planner.schema";
import type { DifferentiationDraft, WizardState } from "../types";

export interface Step4DifferentiationProps {
  plannerId: string;
  state: WizardState;
  updateField: <K extends keyof WizardState>(key: K, value: WizardState[K]) => void;
}

function hasDifferentiationContent(value: DifferentiationDraft): boolean {
  return DIFFERENTIATION_FIELDS.some((field) => value[field.key].trim() !== "");
}

/** Existing text is never dropped — the AI's suggestion is added after it, not over it. */
function appendDifferentiation(
  existing: DifferentiationDraft,
  suggestion: DifferentiationPlanInput,
): DifferentiationDraft {
  const merged = { ...existing };
  for (const field of DIFFERENTIATION_FIELDS) {
    const current = existing[field.key].trim();
    const incoming = suggestion[field.key].trim();
    if (!incoming) continue;
    merged[field.key] = current ? `${current}\n\n${incoming}` : incoming;
  }
  return merged;
}

export function Step4Differentiation({ plannerId, state, updateField }: Step4DifferentiationProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-sm font-medium text-foreground">Differentiation Plan</p>
          <p className="text-xs text-muted-foreground">
            Plan each dimension separately for the learners in this class.
          </p>
        </div>
        <DifferentiationPlanFields
          value={state.differentiation}
          onChange={(value) => updateField("differentiation", value)}
        />
        <AIAssistPanel<DifferentiationPlanInput>
          label="Differentiation"
          hasExistingContent={hasDifferentiationContent(state.differentiation)}
          fetchSuggestion={async () => {
            const { suggestion } = await requestAISuggestion<DifferentiationSuggestion>(
              plannerId,
              "differentiation",
              { reflectionSourceLessonId: state.reflectionContextLessonId },
            );
            return suggestion.differentiation;
          }}
          renderPreview={(value) => <DifferentiationPreview value={value} />}
          onAppend={(value) =>
            updateField("differentiation", appendDifferentiation(state.differentiation, value))
          }
          onReplace={(value) => updateField("differentiation", { ...value })}
        />
      </div>

      <TagListInput
        id="wizard-learning-tasks"
        label="Learning Tasks"
        values={state.learningTasks}
        onChange={(values) => updateField("learningTasks", values)}
        placeholder="e.g. Play an activity ball game for binary number conversion"
      />

      <div className="flex flex-col gap-2">
        <TagListInput
          id="wizard-pedagogical-exemplars"
          label="Pedagogical Exemplars"
          values={state.pedagogicalExemplars}
          onChange={(values) => updateField("pedagogicalExemplars", values)}
          placeholder="e.g. Use flash card games before the conversion activity"
        />
        <AIAssistPanel<string[]>
          label="Pedagogical Exemplars"
          hasExistingContent={state.pedagogicalExemplars.length > 0}
          fetchSuggestion={async () => {
            const { suggestion } = await requestAISuggestion<PedagogicalExemplarsSuggestion>(
              plannerId,
              "pedagogical-exemplars",
              { reflectionSourceLessonId: state.reflectionContextLessonId },
            );
            return suggestion.pedagogicalExemplars;
          }}
          renderPreview={(items) => <StringListPreview items={items} />}
          onAppend={(items) =>
            updateField("pedagogicalExemplars", [...state.pedagogicalExemplars, ...items])
          }
          onReplace={(items) => updateField("pedagogicalExemplars", items)}
        />
      </div>
    </div>
  );
}

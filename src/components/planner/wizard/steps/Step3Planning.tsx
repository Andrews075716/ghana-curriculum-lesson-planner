"use client";

import { TagListInput } from "../TagListInput";
import { CrossCuttingThemesField } from "../CrossCuttingThemesField";
import { AIAssistPanel } from "../ai/AIAssistPanel";
import { StringListPreview } from "../ai/previews";
import { requestAISuggestion } from "@/lib/ai-client";
import type {
  EssentialQuestionsSuggestion,
  PedagogicalStrategiesSuggestion,
  TeachingLearningResourcesSuggestion,
} from "@/lib/validation/ai.schema";
import type { WizardState } from "../types";

export interface Step3PlanningProps {
  plannerId: string;
  state: WizardState;
  updateField: <K extends keyof WizardState>(key: K, value: WizardState[K]) => void;
  fieldErrors: Record<string, string>;
}

export function Step3Planning({ plannerId, state, updateField, fieldErrors }: Step3PlanningProps) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <TagListInput
          id="wizard-essential-questions"
          label="Essential Questions"
          values={state.essentialQuestions}
          onChange={(values) => updateField("essentialQuestions", values)}
          placeholder="e.g. How would you express decimal numbers in binary?"
        />
        <AIAssistPanel<string[]>
          label="Essential Questions"
          hasExistingContent={state.essentialQuestions.length > 0}
          fetchSuggestion={async () => {
            const { suggestion } = await requestAISuggestion<EssentialQuestionsSuggestion>(
              plannerId,
              "essential-questions",
              { reflectionSourceLessonId: state.reflectionContextLessonId },
            );
            return suggestion.essentialQuestions;
          }}
          renderPreview={(items) => <StringListPreview items={items} />}
          onAppend={(items) => updateField("essentialQuestions", [...state.essentialQuestions, ...items])}
          onReplace={(items) => updateField("essentialQuestions", items)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <CrossCuttingThemesField
          value={state.crossCuttingThemes}
          onChange={(value) => updateField("crossCuttingThemes", value)}
        />
        {fieldErrors.crossCuttingThemes ? (
          <p role="alert" className="text-sm text-destructive">
            {fieldErrors.crossCuttingThemes}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <TagListInput
          id="wizard-pedagogical-strategies"
          label="Pedagogical Strategies"
          values={state.pedagogicalStrategies}
          onChange={(values) => updateField("pedagogicalStrategies", values)}
          placeholder="e.g. Think-Pair-Share"
        />
        <AIAssistPanel<string[]>
          label="Pedagogical Strategies"
          hasExistingContent={state.pedagogicalStrategies.length > 0}
          fetchSuggestion={async () => {
            const { suggestion } = await requestAISuggestion<PedagogicalStrategiesSuggestion>(
              plannerId,
              "pedagogical-strategies",
              { reflectionSourceLessonId: state.reflectionContextLessonId },
            );
            return suggestion.pedagogicalStrategies;
          }}
          renderPreview={(items) => <StringListPreview items={items} />}
          onAppend={(items) =>
            updateField("pedagogicalStrategies", [...state.pedagogicalStrategies, ...items])
          }
          onReplace={(items) => updateField("pedagogicalStrategies", items)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <TagListInput
          id="wizard-resources"
          label="Teaching & Learning Resources"
          values={state.teachingLearningResources}
          onChange={(values) => updateField("teachingLearningResources", values)}
          placeholder="e.g. Laptop computers"
        />
        <AIAssistPanel<string[]>
          label="Teaching & Learning Resources"
          hasExistingContent={state.teachingLearningResources.length > 0}
          fetchSuggestion={async () => {
            const { suggestion } = await requestAISuggestion<TeachingLearningResourcesSuggestion>(
              plannerId,
              "teaching-learning-resources",
              { reflectionSourceLessonId: state.reflectionContextLessonId },
            );
            return suggestion.teachingLearningResources;
          }}
          renderPreview={(items) => <StringListPreview items={items} />}
          onAppend={(items) =>
            updateField("teachingLearningResources", [...state.teachingLearningResources, ...items])
          }
          onReplace={(items) => updateField("teachingLearningResources", items)}
        />
      </div>

      <TagListInput
        id="wizard-keywords"
        label="Keywords"
        values={state.keywords}
        onChange={(values) => updateField("keywords", values)}
        placeholder="e.g. bit pattern"
      />
    </div>
  );
}

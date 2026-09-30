"use client";

import { CurriculumSelectField } from "@/components/curriculum/CurriculumSelectField";
import type { UseCurriculumOptionsResult } from "@/hooks/useCurriculumOptions";
import type { WizardState } from "../types";

export interface Step2CurriculumAlignmentProps {
  state: WizardState;
  onStrandChange: (id: string) => void;
  onSubStrandChange: (id: string) => void;
  onContentStandardChange: (id: string) => void;
  onLearningOutcomeChange: (id: string) => void;
  onLearningIndicatorChange: (id: string) => void;
  strands: UseCurriculumOptionsResult;
  subStrands: UseCurriculumOptionsResult;
  contentStandards: UseCurriculumOptionsResult;
  learningOutcomes: UseCurriculumOptionsResult;
  learningIndicators: UseCurriculumOptionsResult;
  fieldErrors: Record<string, string>;
}

export function Step2CurriculumAlignment({
  state,
  onStrandChange,
  onSubStrandChange,
  onContentStandardChange,
  onLearningOutcomeChange,
  onLearningIndicatorChange,
  strands,
  subStrands,
  contentStandards,
  learningOutcomes,
  learningIndicators,
  fieldErrors,
}: Step2CurriculumAlignmentProps) {
  return (
    <div className="flex flex-col gap-4">
      <CurriculumSelectField
        id="wizard-strand"
        label="Strand"
        value={state.strandId}
        onValueChange={onStrandChange}
        options={strands.options}
        status={strands.status}
        errorMessage={strands.errorMessage}
        onRetry={strands.refetch}
        disabled={!state.classLevelId}
        disabledMessage="Complete Basic Information first."
        emptyMessage="No strands are available for this subject and class level."
        validationError={fieldErrors.strandId}
      />
      <CurriculumSelectField
        id="wizard-sub-strand"
        label="Sub-Strand"
        value={state.subStrandId}
        onValueChange={onSubStrandChange}
        options={subStrands.options}
        status={subStrands.status}
        errorMessage={subStrands.errorMessage}
        onRetry={subStrands.refetch}
        disabled={!state.strandId}
        disabledMessage="Select a strand first."
        emptyMessage="No sub-strands are available for this strand."
        validationError={fieldErrors.subStrandId}
      />
      <CurriculumSelectField
        id="wizard-content-standard"
        label="Content Standard"
        value={state.contentStandardId}
        onValueChange={onContentStandardChange}
        options={contentStandards.options}
        status={contentStandards.status}
        errorMessage={contentStandards.errorMessage}
        onRetry={contentStandards.refetch}
        disabled={!state.subStrandId}
        disabledMessage="Select a sub-strand first."
        emptyMessage="No content standards are available for this sub-strand."
        validationError={fieldErrors.contentStandardId}
      />
      <CurriculumSelectField
        id="wizard-learning-outcome"
        label="Learning Outcome"
        value={state.learningOutcomeId}
        onValueChange={onLearningOutcomeChange}
        options={learningOutcomes.options}
        status={learningOutcomes.status}
        errorMessage={learningOutcomes.errorMessage}
        onRetry={learningOutcomes.refetch}
        disabled={!state.contentStandardId}
        disabledMessage="Select a content standard first."
        emptyMessage="No learning outcomes are available for this content standard."
        validationError={fieldErrors.learningOutcomeId}
      />
      <CurriculumSelectField
        id="wizard-learning-indicator"
        label="Learning Indicator"
        value={state.learningIndicatorId}
        onValueChange={onLearningIndicatorChange}
        options={learningIndicators.options}
        status={learningIndicators.status}
        errorMessage={learningIndicators.errorMessage}
        onRetry={learningIndicators.refetch}
        disabled={!state.learningOutcomeId}
        disabledMessage="Select a learning outcome first."
        emptyMessage="No learning indicators are available for this outcome."
        validationError={fieldErrors.learningIndicatorId}
      />
    </div>
  );
}

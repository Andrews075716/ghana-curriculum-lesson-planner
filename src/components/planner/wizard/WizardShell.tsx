"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useCurriculumOptions } from "@/hooks/useCurriculumOptions";
import { useAutosave } from "@/hooks/useAutosave";
import { useUnsavedChangesWarning } from "@/hooks/useUnsavedChangesWarning";
import { WIZARD_STEPS } from "@/lib/constants/planner-wizard";
import { WizardStepper } from "./WizardStepper";
import { Step1BasicInfo } from "./steps/Step1BasicInfo";
import { Step2CurriculumAlignment } from "./steps/Step2CurriculumAlignment";
import { Step3Planning } from "./steps/Step3Planning";
import { Step4Differentiation } from "./steps/Step4Differentiation";
import { Step5MainLesson } from "./steps/Step5MainLesson";
import { Step6Assessment } from "./steps/Step6Assessment";
import { Step7Review } from "./steps/Step7Review";
import { validateStep } from "./validateStep";
import { buildDraftUpdatePayload, type WizardState } from "./types";
import type { PlannerDraftUpdate } from "@/lib/validation/planner.schema";

export interface WizardShellProps {
  plannerId: string;
  initialState: WizardState;
  alreadyPublished: boolean;
}

async function saveDraft(plannerId: string, data: PlannerDraftUpdate): Promise<void> {
  const res = await fetch(`/api/planners/${plannerId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error?.message ?? "Failed to save.");
  }
}

export function WizardShell({ plannerId, initialState, alreadyPublished }: WizardShellProps) {
  const router = useRouter();
  const [state, setState] = useState<WizardState>(initialState);
  const [currentStep, setCurrentStep] = useState(1);
  const [furthestStep, setFurthestStep] = useState(1);
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishSuccess, setPublishSuccess] = useState(alreadyPublished);

  const updateField = useCallback(
    <K extends keyof WizardState>(key: K, value: WizardState[K]) => {
      setState((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  // --- Curriculum cascade (shared across Step 1 and Step 2) ---
  const subjects = useCurriculumOptions("/api/curriculum/subjects");
  const classLevels = useCurriculumOptions(
    state.subjectId ? `/api/curriculum/class-levels?subjectId=${state.subjectId}` : null,
  );
  const strands = useCurriculumOptions(
    state.subjectId && state.classLevelId
      ? `/api/curriculum/strands?subjectId=${state.subjectId}&classLevelId=${state.classLevelId}`
      : null,
  );
  const subStrands = useCurriculumOptions(
    state.strandId ? `/api/curriculum/sub-strands?strandId=${state.strandId}` : null,
  );
  const contentStandards = useCurriculumOptions(
    state.subStrandId ? `/api/curriculum/content-standards?subStrandId=${state.subStrandId}` : null,
  );
  const learningOutcomes = useCurriculumOptions(
    state.contentStandardId
      ? `/api/curriculum/learning-outcomes?contentStandardId=${state.contentStandardId}`
      : null,
  );
  const learningIndicators = useCurriculumOptions(
    state.learningOutcomeId
      ? `/api/curriculum/learning-indicators?learningOutcomeId=${state.learningOutcomeId}`
      : null,
  );
  const crossCuttingThemes = useCurriculumOptions("/api/cross-cutting-themes");
  const crossCuttingThemeLabels = useMemo(
    () => new Map(crossCuttingThemes.options.map((o) => [o.id, o.label])),
    [crossCuttingThemes.options],
  );

  const handleSubjectChange = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      subjectId: id,
      classLevelId: "",
      classLevelLabel: "",
      strandId: "",
      subStrandId: "",
      contentStandardId: "",
      learningOutcomeId: "",
      learningIndicatorId: "",
      reflectionContextLessonId: null,
    }));
  }, []);

  const handleClassLevelChange = useCallback((id: string, label: string) => {
    setState((prev) => ({
      ...prev,
      classLevelId: id,
      classLevelLabel: label,
      strandId: "",
      subStrandId: "",
      contentStandardId: "",
      learningOutcomeId: "",
      learningIndicatorId: "",
      reflectionContextLessonId: null,
    }));
  }, []);

  const handleStrandChange = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      strandId: id,
      subStrandId: "",
      contentStandardId: "",
      learningOutcomeId: "",
      learningIndicatorId: "",
    }));
  }, []);

  const handleSubStrandChange = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      subStrandId: id,
      contentStandardId: "",
      learningOutcomeId: "",
      learningIndicatorId: "",
    }));
  }, []);

  const handleContentStandardChange = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      contentStandardId: id,
      learningOutcomeId: "",
      learningIndicatorId: "",
    }));
  }, []);

  const handleLearningOutcomeChange = useCallback((id: string) => {
    setState((prev) => ({ ...prev, learningOutcomeId: id, learningIndicatorId: "" }));
  }, []);

  const handleLearningIndicatorChange = useCallback((id: string) => {
    setState((prev) => ({ ...prev, learningIndicatorId: id }));
  }, []);

  // --- Autosave ---
  const payload = useMemo(() => buildDraftUpdatePayload(state), [state]);
  const save = useCallback((data: PlannerDraftUpdate) => saveDraft(plannerId, data), [plannerId]);
  const { status: saveStatus, isDirty, errorMessage: saveError, flush } = useAutosave(payload, save);

  useUnsavedChangesWarning(isDirty && !publishSuccess);

  // --- Step navigation ---
  const stepValidation = useMemo(() => validateStep(currentStep, state), [currentStep, state]);

  const goToStep = useCallback(
    async (nextStep: number) => {
      await flush();
      setCurrentStep(nextStep);
      setFurthestStep((prev) => Math.max(prev, nextStep));
      setShowValidationErrors(false);
    },
    [flush],
  );

  function handleNext() {
    if (!stepValidation.valid) {
      setShowValidationErrors(true);
      return;
    }
    goToStep(Math.min(currentStep + 1, WIZARD_STEPS.length));
  }

  function handlePrevious() {
    goToStep(Math.max(currentStep - 1, 1));
  }

  function handleStepClick(step: number) {
    if (step <= furthestStep) goToStep(step);
  }

  async function handlePublish() {
    await flush();
    setIsPublishing(true);
    setPublishError(null);
    try {
      const res = await fetch(`/api/planners/${plannerId}/publish`, { method: "POST" });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(body?.error?.message ?? "This planner isn't ready to save yet.");
      }
      setPublishSuccess(true);
      router.refresh();
    } catch (error) {
      setPublishError(error instanceof Error ? error.message : "Failed to save the planner.");
    } finally {
      setIsPublishing(false);
    }
  }

  const isLastStep = currentStep === WIZARD_STEPS.length;

  return (
    <div className="flex flex-col gap-4">
      <WizardStepper
        currentStep={currentStep}
        furthestStep={furthestStep}
        onStepClick={handleStepClick}
      />

      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {saveStatus === "saving" ? (
          <>
            <Loader2 className="size-3.5 animate-spin" />
            Saving…
          </>
        ) : saveStatus === "saved" ? (
          <>
            <CheckCircle2 className="size-3.5 text-primary" />
            Saved
          </>
        ) : saveStatus === "error" ? (
          <>
            <AlertCircle className="size-3.5 text-destructive" />
            <span className="text-destructive">{saveError ?? "Couldn't save."}</span>
          </>
        ) : (
          <span>Draft</span>
        )}
      </div>

      {publishSuccess ? (
        <Alert>
          <CheckCircle2 className="size-4" />
          <AlertTitle>Planner saved</AlertTitle>
          <AlertDescription>
            This lesson planner has been published. You can keep reviewing it below, or head back
            to your dashboard.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="rounded-xl border bg-card p-4 sm:p-6">
        {currentStep === 1 ? (
          <Step1BasicInfo
            plannerId={plannerId}
            state={state}
            updateField={updateField}
            onSubjectChange={handleSubjectChange}
            onClassLevelChange={handleClassLevelChange}
            subjects={subjects}
            classLevels={classLevels}
            fieldErrors={showValidationErrors ? stepValidation.fieldErrors : {}}
          />
        ) : null}
        {currentStep === 2 ? (
          <Step2CurriculumAlignment
            state={state}
            onStrandChange={handleStrandChange}
            onSubStrandChange={handleSubStrandChange}
            onContentStandardChange={handleContentStandardChange}
            onLearningOutcomeChange={handleLearningOutcomeChange}
            onLearningIndicatorChange={handleLearningIndicatorChange}
            strands={strands}
            subStrands={subStrands}
            contentStandards={contentStandards}
            learningOutcomes={learningOutcomes}
            learningIndicators={learningIndicators}
            fieldErrors={showValidationErrors ? stepValidation.fieldErrors : {}}
          />
        ) : null}
        {currentStep === 3 ? (
          <Step3Planning
            plannerId={plannerId}
            state={state}
            updateField={updateField}
            fieldErrors={showValidationErrors ? stepValidation.fieldErrors : {}}
          />
        ) : null}
        {currentStep === 4 ? (
          <Step4Differentiation plannerId={plannerId} state={state} updateField={updateField} />
        ) : null}
        {currentStep === 5 ? (
          <Step5MainLesson
            plannerId={plannerId}
            state={state}
            updateField={updateField}
            fieldErrors={showValidationErrors ? stepValidation.fieldErrors : {}}
          />
        ) : null}
        {currentStep === 6 ? (
          <Step6Assessment
            plannerId={plannerId}
            state={state}
            updateField={updateField}
            fieldErrors={showValidationErrors ? stepValidation.fieldErrors : {}}
          />
        ) : null}
        {currentStep === 7 ? (
          <Step7Review
            state={state}
            subjects={subjects}
            classLevels={classLevels}
            strands={strands}
            subStrands={subStrands}
            contentStandards={contentStandards}
            learningOutcomes={learningOutcomes}
            learningIndicators={learningIndicators}
            crossCuttingThemeLabels={crossCuttingThemeLabels}
          />
        ) : null}

        {showValidationErrors && !stepValidation.valid && currentStep !== 7 ? (
          <p role="alert" className="mt-3 text-sm text-destructive">
            Please fix the highlighted fields before continuing.
          </p>
        ) : null}
      </div>

      {publishError ? (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Couldn&apos;t save the planner</AlertTitle>
          <AlertDescription>{publishError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 1}
        >
          Previous
        </Button>
        {isLastStep ? (
          <Button type="button" onClick={handlePublish} disabled={isPublishing}>
            {isPublishing ? <Loader2 className="size-4 animate-spin" /> : null}
            Save Planner
          </Button>
        ) : (
          <Button type="button" onClick={handleNext}>
            Next
          </Button>
        )}
      </div>
    </div>
  );
}

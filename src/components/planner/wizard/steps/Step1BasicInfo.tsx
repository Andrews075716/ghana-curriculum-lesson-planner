"use client";

import { Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CurriculumSelectField } from "@/components/curriculum/CurriculumSelectField";
import { TERM_OPTIONS } from "@/lib/constants/planner-wizard";
import { useCurriculumOptions, type UseCurriculumOptionsResult } from "@/hooks/useCurriculumOptions";
import type { WizardState } from "../types";

const NO_REFLECTION_CONTEXT = "__none__";

export interface Step1BasicInfoProps {
  plannerId: string;
  state: WizardState;
  updateField: <K extends keyof WizardState>(key: K, value: WizardState[K]) => void;
  onSubjectChange: (id: string) => void;
  onClassLevelChange: (id: string, label: string) => void;
  subjects: UseCurriculumOptionsResult;
  classLevels: UseCurriculumOptionsResult;
  fieldErrors: Record<string, string>;
}

export function Step1BasicInfo({
  plannerId,
  state,
  updateField,
  onSubjectChange,
  onClassLevelChange,
  subjects,
  classLevels,
  fieldErrors,
}: Step1BasicInfoProps) {
  const reflectableLessons = useCurriculumOptions(
    state.subjectId && state.classLevelId
      ? `/api/planners/${plannerId}/reflectable-lessons?subjectId=${state.subjectId}&classLevelId=${state.classLevelId}`
      : null,
  );
  const hasReflectionOptions =
    reflectableLessons.status === "success" && reflectableLessons.options.length > 0;
  return (
    <div className="flex flex-col gap-4">
      <CurriculumSelectField
        id="wizard-subject"
        label="Subject"
        value={state.subjectId}
        onValueChange={onSubjectChange}
        options={subjects.options}
        status={subjects.status}
        errorMessage={subjects.errorMessage}
        onRetry={subjects.refetch}
        emptyMessage="No subjects are available yet."
        validationError={fieldErrors.subjectId}
      />

      <CurriculumSelectField
        id="wizard-class-level"
        label="Class / Form"
        value={state.classLevelId}
        onValueChange={(id) => {
          const label = classLevels.options.find((o) => o.id === id)?.label ?? "";
          onClassLevelChange(id, label);
        }}
        options={classLevels.options}
        status={classLevels.status}
        errorMessage={classLevels.errorMessage}
        onRetry={classLevels.refetch}
        disabled={!state.subjectId}
        disabledMessage="Select a subject first."
        emptyMessage="No class levels are available for this subject."
        validationError={fieldErrors.classLevelId}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="wizard-term">Term</Label>
          <Select
            value={state.term || null}
            onValueChange={(next) => {
              if (next) updateField("term", next as WizardState["term"]);
            }}
          >
            <SelectTrigger id="wizard-term" className="w-full" aria-invalid={Boolean(fieldErrors.term)}>
              <SelectValue placeholder="Select term" />
            </SelectTrigger>
            <SelectContent>
              {TERM_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fieldErrors.term ? (
            <p role="alert" className="text-xs text-destructive">
              {fieldErrors.term}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="wizard-week">Week</Label>
          <Input
            id="wizard-week"
            type="number"
            min={1}
            max={52}
            value={state.weekNumber}
            aria-invalid={Boolean(fieldErrors.weekNumber)}
            onChange={(event) => updateField("weekNumber", event.target.value)}
          />
          {fieldErrors.weekNumber ? (
            <p role="alert" className="text-xs text-destructive">
              {fieldErrors.weekNumber}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="wizard-lesson-number">Lesson Number</Label>
          <Input
            id="wizard-lesson-number"
            type="number"
            min={1}
            max={20}
            value={state.lessonNumber}
            aria-invalid={Boolean(fieldErrors.lessonNumber)}
            onChange={(event) => updateField("lessonNumber", event.target.value)}
          />
          {fieldErrors.lessonNumber ? (
            <p role="alert" className="text-xs text-destructive">
              {fieldErrors.lessonNumber}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="wizard-date">Date</Label>
          <Input
            id="wizard-date"
            type="date"
            value={state.lessonDate}
            onChange={(event) => updateField("lessonDate", event.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="wizard-duration">Duration (minutes)</Label>
          <Input
            id="wizard-duration"
            type="number"
            min={1}
            max={600}
            value={state.durationMinutes}
            aria-invalid={Boolean(fieldErrors.durationMinutes)}
            onChange={(event) => updateField("durationMinutes", event.target.value)}
          />
          {fieldErrors.durationMinutes ? (
            <p role="alert" className="text-xs text-destructive">
              {fieldErrors.durationMinutes}
            </p>
          ) : null}
        </div>
      </div>

      {hasReflectionOptions ? (
        <div className="flex flex-col gap-1.5 rounded-lg border border-dashed border-primary/30 bg-primary/[0.03] p-3">
          <Label htmlFor="wizard-reflection-context" className="flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-primary" />
            Use a previous lesson&apos;s reflection as AI context (optional)
          </Label>
          <p className="text-xs text-muted-foreground">
            Shares that lesson&apos;s reflection with the AI as background when generating
            suggestions for this lesson. It only informs suggestions — that earlier lesson is
            never changed.
          </p>
          <Select
            value={state.reflectionContextLessonId ?? NO_REFLECTION_CONTEXT}
            onValueChange={(next) =>
              updateField(
                "reflectionContextLessonId",
                next && next !== NO_REFLECTION_CONTEXT ? next : null,
              )
            }
          >
            <SelectTrigger id="wizard-reflection-context" className="w-full">
              <SelectValue>
                {(current) =>
                  current && current !== NO_REFLECTION_CONTEXT
                    ? (reflectableLessons.options.find((o) => o.id === current)?.label ?? current)
                    : "Don't use a previous reflection"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_REFLECTION_CONTEXT}>Don&apos;t use a previous reflection</SelectItem>
              {reflectableLessons.options.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}
    </div>
  );
}

"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { WIZARD_STEPS } from "@/lib/constants/planner-wizard";

export interface WizardStepperProps {
  currentStep: number;
  /** Steps the user has already reached — clicking one jumps back to it. */
  furthestStep: number;
  onStepClick: (step: number) => void;
}

export function WizardStepper({ currentStep, furthestStep, onStepClick }: WizardStepperProps) {
  const total = WIZARD_STEPS.length;
  const current = WIZARD_STEPS.find((s) => s.id === currentStep);

  return (
    <div className="flex flex-col gap-2">
      {/* Mobile: compact label + progress bar */}
      <div className="sm:hidden">
        <p className="text-sm font-medium text-foreground">
          Step {currentStep} of {total}: {current?.label}
        </p>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${(currentStep / total) * 100}%` }}
          />
        </div>
      </div>

      {/* Desktop/tablet: full stepper */}
      <ol className="hidden items-start gap-1 sm:flex">
        {WIZARD_STEPS.map((step, index) => {
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;
          const isReachable = step.id <= furthestStep;

          return (
            <li key={step.id} className="flex flex-1 flex-col items-center gap-1.5">
              <div className="flex w-full items-center">
                {index > 0 ? (
                  <div
                    className={cn(
                      "h-px flex-1",
                      step.id <= furthestStep ? "bg-primary" : "bg-border",
                    )}
                  />
                ) : null}
                <button
                  type="button"
                  disabled={!isReachable}
                  onClick={() => isReachable && onStepClick(step.id)}
                  aria-current={isCurrent ? "step" : undefined}
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-medium transition-colors",
                    isCurrent
                      ? "border-primary bg-primary text-primary-foreground"
                      : isCompleted
                        ? "border-primary bg-primary/10 text-primary hover:bg-primary/20"
                        : isReachable
                          ? "border-border text-foreground hover:bg-muted"
                          : "border-border text-muted-foreground",
                  )}
                >
                  {isCompleted ? <Check className="size-3.5" /> : step.id}
                </button>
                {index < WIZARD_STEPS.length - 1 ? (
                  <div
                    className={cn(
                      "h-px flex-1",
                      step.id < furthestStep ? "bg-primary" : "bg-border",
                    )}
                  />
                ) : null}
              </div>
              <span
                className={cn(
                  "text-center text-[11px] leading-tight",
                  isCurrent ? "font-medium text-foreground" : "text-muted-foreground",
                )}
              >
                {step.shortLabel}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

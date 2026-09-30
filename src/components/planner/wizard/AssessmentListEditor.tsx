"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { DOK_LEVEL_OPTIONS } from "@/lib/constants/planner-wizard";
import type { AssessmentDraft } from "./types";

export interface AssessmentListEditorProps {
  assessments: AssessmentDraft[];
  onChange: (assessments: AssessmentDraft[]) => void;
}

function createBlankAssessment(): AssessmentDraft {
  return { key: crypto.randomUUID(), dokLevel: "", description: "" };
}

export function AssessmentListEditor({ assessments, onChange }: AssessmentListEditorProps) {
  function update(key: string, patch: Partial<AssessmentDraft>) {
    onChange(assessments.map((a) => (a.key === key ? { ...a, ...patch } : a)));
  }

  function remove(key: string) {
    onChange(assessments.filter((a) => a.key !== key));
  }

  return (
    <div className="flex flex-col gap-3">
      {assessments.map((assessment, index) => (
        <Card key={assessment.key}>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                Assessment {index + 1}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => remove(assessment.key)}
                aria-label={`Remove assessment ${index + 1}`}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${assessment.key}-dok`}>Depth of Knowledge Level</Label>
              <Select
                value={assessment.dokLevel || null}
                onValueChange={(next) => {
                  if (next) update(assessment.key, { dokLevel: next as AssessmentDraft["dokLevel"] });
                }}
              >
                <SelectTrigger id={`${assessment.key}-dok`} className="w-full">
                  <SelectValue placeholder="Select a DoK level" />
                </SelectTrigger>
                <SelectContent>
                  {DOK_LEVEL_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${assessment.key}-description`}>Assessment</Label>
              <Textarea
                id={`${assessment.key}-description`}
                rows={3}
                value={assessment.description}
                onChange={(event) => update(assessment.key, { description: event.target.value })}
              />
            </div>
          </CardContent>
        </Card>
      ))}

      <Button
        type="button"
        variant="outline"
        className="self-start"
        onClick={() => onChange([...assessments, createBlankAssessment()])}
      >
        <Plus className="size-4" />
        Add Assessment
      </Button>
    </div>
  );
}

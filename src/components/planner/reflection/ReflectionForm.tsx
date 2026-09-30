"use client";

import { useCallback, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAutosave } from "@/hooks/useAutosave";
import type { ReflectionData, ReflectionInput } from "@/lib/validation/lesson.schema";

export interface ReflectionFormProps {
  plannerId: string;
  lessonId: string;
  learningIndicator: string | null;
  initialReflection: ReflectionData;
}

const QUESTIONS: Array<{
  key: keyof ReflectionData;
  label: string;
  placeholder: string;
}> = [
  {
    key: "whatWentWell",
    label: "What went well?",
    placeholder: "e.g. Learners engaged well with the pair activity and grasped binary conversion quickly.",
  },
  {
    key: "subgroupsCatered",
    label: "Were different learner groups catered for?",
    placeholder: "e.g. Weaker learners were paired with peer tutors; advanced learners got extension questions.",
  },
  {
    key: "difficulties",
    label: "What difficulties occurred?",
    placeholder: "e.g. Some learners struggled with place value when converting larger numbers.",
  },
  {
    key: "indicatorsAchieved",
    label: "Which learning indicators were achieved?",
    placeholder: "e.g. Most learners could describe data as bit patterns; a few need more practice.",
  },
  {
    key: "reteachingNeeded",
    label: "What needs reteaching?",
    placeholder: "e.g. Revisit place value in binary before moving to hexadecimal.",
  },
  {
    key: "nextLessonChanges",
    label: "What should change next lesson?",
    placeholder: "e.g. Start with a shorter recap and allow more time for guided practice.",
  },
  {
    key: "remarks",
    label: "Additional remarks",
    placeholder: "Anything else worth noting.",
  },
];

async function saveReflection(
  plannerId: string,
  lessonId: string,
  data: ReflectionInput,
): Promise<void> {
  const res = await fetch(`/api/planners/${plannerId}/lessons/${lessonId}/reflection`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error?.message ?? "Failed to save the reflection.");
  }
}

export function ReflectionForm({
  plannerId,
  lessonId,
  learningIndicator,
  initialReflection,
}: ReflectionFormProps) {
  const [reflection, setReflection] = useState<ReflectionData>(initialReflection);

  const save = useCallback(
    (data: ReflectionData) => saveReflection(plannerId, lessonId, data),
    [plannerId, lessonId],
  );
  const { status, errorMessage } = useAutosave(reflection, save);

  function update(key: keyof ReflectionData, value: string) {
    setReflection((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {status === "saving" ? (
          <>
            <Loader2 className="size-3.5 animate-spin" />
            Saving…
          </>
        ) : status === "saved" ? (
          <>
            <CheckCircle2 className="size-3.5 text-primary" />
            Saved
          </>
        ) : status === "error" ? (
          <>
            <AlertCircle className="size-3.5 text-destructive" />
            <span className="text-destructive">{errorMessage ?? "Couldn't save."}</span>
          </>
        ) : (
          <span>No unsaved changes</span>
        )}
      </div>

      {QUESTIONS.map((question) => (
        <div key={question.key} className="flex flex-col gap-1.5">
          <Label htmlFor={`reflection-${question.key}`}>{question.label}</Label>
          {question.key === "indicatorsAchieved" && learningIndicator ? (
            <p className="text-xs text-muted-foreground">
              Target learning indicator: <span className="italic">{learningIndicator}</span>
            </p>
          ) : null}
          <Textarea
            id={`reflection-${question.key}`}
            rows={3}
            value={reflection[question.key] ?? ""}
            placeholder={question.placeholder}
            onChange={(event) => update(question.key, event.target.value)}
          />
        </div>
      ))}
    </div>
  );
}

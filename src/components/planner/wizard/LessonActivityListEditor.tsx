"use client";

import { AlertTriangle, ArrowDown, ArrowUp, Copy, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { LESSON_ACTIVITY_STAGE_OPTIONS } from "@/lib/constants/planner-wizard";
import type { LessonActivityDraft } from "./types";

export interface LessonActivityListEditorProps {
  activities: LessonActivityDraft[];
  onChange: (activities: LessonActivityDraft[]) => void;
  /** The lesson's planned duration (Step 1), for the total-vs-planned comparison. Null if not set yet. */
  plannedDurationMinutes: number | null;
}

function createBlankActivity(): LessonActivityDraft {
  return {
    key: crypto.randomUUID(),
    stage: "ACTIVITY",
    label: "",
    durationMinutes: "",
    teacherActivity: "",
    learnerActivity: "",
  };
}

function stageLabel(stage: string): string {
  return LESSON_ACTIVITY_STAGE_OPTIONS.find((option) => option.value === stage)?.label ?? stage;
}

export function LessonActivityListEditor({
  activities,
  onChange,
  plannedDurationMinutes,
}: LessonActivityListEditorProps) {
  function update(key: string, patch: Partial<LessonActivityDraft>) {
    onChange(activities.map((a) => (a.key === key ? { ...a, ...patch } : a)));
  }

  function remove(key: string) {
    onChange(activities.filter((a) => a.key !== key));
  }

  function duplicate(key: string) {
    const index = activities.findIndex((a) => a.key === key);
    if (index === -1) return;
    const copy: LessonActivityDraft = { ...activities[index], key: crypto.randomUUID() };
    const next = [...activities];
    next.splice(index + 1, 0, copy);
    onChange(next);
  }

  function move(key: string, direction: -1 | 1) {
    const index = activities.findIndex((a) => a.key === key);
    const targetIndex = index + direction;
    if (index === -1 || targetIndex < 0 || targetIndex >= activities.length) return;
    const next = [...activities];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    onChange(next);
  }

  const totalDurationMinutes = activities.reduce((sum, activity) => {
    const parsed = Number.parseInt(activity.durationMinutes, 10);
    return sum + (Number.isFinite(parsed) ? parsed : 0);
  }, 0);
  const overPlanned =
    plannedDurationMinutes !== null && totalDurationMinutes > plannedDurationMinutes;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
        <span className="text-foreground">
          Total activity time: <strong>{totalDurationMinutes} min</strong>
          {plannedDurationMinutes !== null ? (
            <span className="text-muted-foreground"> of {plannedDurationMinutes} min planned</span>
          ) : null}
        </span>
        {overPlanned ? (
          <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-500">
            <AlertTriangle className="size-3.5" />
            Exceeds the planned lesson duration by {totalDurationMinutes - plannedDurationMinutes!}{" "}
            min
          </span>
        ) : null}
      </div>

      {activities.map((activity, index) => (
        <Card key={activity.key}>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-foreground">
                {index + 1}. {stageLabel(activity.stage)}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => move(activity.key, -1)}
                  disabled={index === 0}
                  aria-label={`Move activity ${index + 1} up`}
                >
                  <ArrowUp className="size-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => move(activity.key, 1)}
                  disabled={index === activities.length - 1}
                  aria-label={`Move activity ${index + 1} down`}
                >
                  <ArrowDown className="size-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => duplicate(activity.key)}
                  aria-label={`Duplicate activity ${index + 1}`}
                >
                  <Copy className="size-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => remove(activity.key)}
                  aria-label={`Remove activity ${index + 1}`}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto]">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`${activity.key}-stage`}>Stage</Label>
                <Select
                  value={activity.stage}
                  onValueChange={(next) => {
                    if (next) update(activity.key, { stage: next as LessonActivityDraft["stage"] });
                  }}
                >
                  <SelectTrigger id={`${activity.key}-stage`} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LESSON_ACTIVITY_STAGE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`${activity.key}-label`}>Activity Title</Label>
                <Input
                  id={`${activity.key}-label`}
                  value={activity.label}
                  placeholder="e.g. Activity 1"
                  onChange={(event) => update(activity.key, { label: event.target.value })}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`${activity.key}-duration`}>Duration (min)</Label>
                <Input
                  id={`${activity.key}-duration`}
                  type="number"
                  min={1}
                  className="sm:w-28"
                  value={activity.durationMinutes}
                  onChange={(event) =>
                    update(activity.key, { durationMinutes: event.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`${activity.key}-teacher`}>Teacher Activity</Label>
                <Textarea
                  id={`${activity.key}-teacher`}
                  rows={3}
                  value={activity.teacherActivity}
                  onChange={(event) =>
                    update(activity.key, { teacherActivity: event.target.value })
                  }
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`${activity.key}-learner`}>Learner Activity</Label>
                <Textarea
                  id={`${activity.key}-learner`}
                  rows={3}
                  value={activity.learnerActivity}
                  onChange={(event) =>
                    update(activity.key, { learnerActivity: event.target.value })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <Button
        type="button"
        variant="outline"
        className="self-start"
        onClick={() => onChange([...activities, createBlankActivity()])}
      >
        <Plus className="size-4" />
        Add Lesson Activity
      </Button>
    </div>
  );
}

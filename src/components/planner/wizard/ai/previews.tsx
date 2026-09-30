import {
  DIFFERENTIATION_FIELDS,
  DOK_LEVEL_OPTIONS,
  LESSON_ACTIVITY_STAGE_OPTIONS,
} from "@/lib/constants/planner-wizard";
import type {
  AssessmentInput,
  DifferentiationPlanInput,
  LessonActivityInput,
} from "@/lib/validation/planner.schema";

/** Small, shared read-only renderers for AIAssistPanel previews — one per suggestion shape. */

export function StringListPreview({ items }: { items: string[] }) {
  if (items.length === 0) {
    return <p className="text-muted-foreground">The AI didn&apos;t suggest anything.</p>;
  }
  return (
    <ul className="list-disc space-y-1 pl-4">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

export function DifferentiationPreview({ value }: { value: DifferentiationPlanInput }) {
  return (
    <dl className="flex flex-col gap-2">
      {DIFFERENTIATION_FIELDS.map((field) => (
        <div key={field.key}>
          <dt className="text-xs font-semibold text-muted-foreground">{field.label}</dt>
          <dd>{value[field.key] || "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ActivityPreviewItem({ activity }: { activity: LessonActivityInput }) {
  const stageLabel =
    LESSON_ACTIVITY_STAGE_OPTIONS.find((s) => s.value === activity.stage)?.label ?? activity.stage;
  return (
    <div className="rounded-md border p-2">
      <div className="flex items-center justify-between gap-2 text-xs font-medium text-foreground">
        <span>
          {stageLabel} — {activity.label}
        </span>
        <span className="text-muted-foreground">{activity.durationMinutes} min</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        <strong>Teacher:</strong> {activity.teacherActivity}
      </p>
      <p className="text-xs text-muted-foreground">
        <strong>Learner:</strong> {activity.learnerActivity}
      </p>
    </div>
  );
}

export function ActivitiesPreview({ items }: { items: LessonActivityInput[] }) {
  if (items.length === 0) {
    return <p className="text-muted-foreground">The AI didn&apos;t suggest anything.</p>;
  }
  return (
    <div className="flex flex-col gap-2">
      {items.map((activity, i) => (
        <ActivityPreviewItem key={i} activity={activity} />
      ))}
    </div>
  );
}

export function AssessmentsPreview({ items }: { items: AssessmentInput[] }) {
  if (items.length === 0) {
    return <p className="text-muted-foreground">The AI didn&apos;t suggest anything.</p>;
  }
  return (
    <div className="flex flex-col gap-2">
      {items.map((assessment, i) => (
        <div key={i} className="rounded-md border p-2">
          <span className="text-xs font-medium text-foreground">
            {DOK_LEVEL_OPTIONS.find((d) => d.value === assessment.dokLevel)?.label ??
              assessment.dokLevel}
          </span>
          <p className="mt-1 text-xs text-muted-foreground">{assessment.description}</p>
        </div>
      ))}
    </div>
  );
}

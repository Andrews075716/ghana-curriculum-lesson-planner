"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DIFFERENTIATION_FIELDS,
  DOK_LEVEL_OPTIONS,
  LESSON_ACTIVITY_STAGE_OPTIONS,
  TERM_OPTIONS,
} from "@/lib/constants/planner-wizard";
import type { UseCurriculumOptionsResult } from "@/hooks/useCurriculumOptions";
import type { WizardState } from "../types";

export interface Step7ReviewProps {
  state: WizardState;
  subjects: UseCurriculumOptionsResult;
  classLevels: UseCurriculumOptionsResult;
  strands: UseCurriculumOptionsResult;
  subStrands: UseCurriculumOptionsResult;
  contentStandards: UseCurriculumOptionsResult;
  learningOutcomes: UseCurriculumOptionsResult;
  learningIndicators: UseCurriculumOptionsResult;
  crossCuttingThemeLabels: Map<string, string>;
}

function labelFor(options: UseCurriculumOptionsResult, id: string): string {
  return options.options.find((o) => o.id === id)?.label ?? "—";
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-sm">{children}</CardContent>
    </Card>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-foreground">{value || "—"}</span>
    </div>
  );
}

function ListField({ label, values }: { label: string; values: string[] }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      {values.length === 0 ? (
        <span className="text-foreground">—</span>
      ) : (
        <ul className="list-disc pl-4 text-foreground">
          {values.map((v, i) => (
            <li key={i}>{v}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function Step7Review({
  state,
  subjects,
  classLevels,
  strands,
  subStrands,
  contentStandards,
  learningOutcomes,
  learningIndicators,
  crossCuttingThemeLabels,
}: Step7ReviewProps) {
  const termLabel = TERM_OPTIONS.find((t) => t.value === state.term)?.label ?? "—";

  return (
    <div className="flex flex-col gap-4">
      <Section title="Basic Information">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field label="Subject" value={labelFor(subjects, state.subjectId)} />
          <Field label="Class / Form" value={labelFor(classLevels, state.classLevelId)} />
          <Field label="Term" value={termLabel} />
          <Field label="Week" value={state.weekNumber} />
          <Field label="Lesson Number" value={state.lessonNumber} />
          <Field label="Date" value={state.lessonDate} />
          <Field label="Duration" value={state.durationMinutes ? `${state.durationMinutes} min` : ""} />
        </div>
      </Section>

      <Section title="Curriculum Alignment">
        <Field label="Strand" value={labelFor(strands, state.strandId)} />
        <Field label="Sub-Strand" value={labelFor(subStrands, state.subStrandId)} />
        <Field label="Content Standard" value={labelFor(contentStandards, state.contentStandardId)} />
        <Field label="Learning Outcome" value={labelFor(learningOutcomes, state.learningOutcomeId)} />
        <Field label="Learning Indicator" value={labelFor(learningIndicators, state.learningIndicatorId)} />
      </Section>

      <Section title="Planning">
        <ListField label="Essential Questions" values={state.essentialQuestions} />
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-muted-foreground">Cross-Cutting Themes</span>
          {state.crossCuttingThemes.length === 0 ? (
            <span className="text-foreground">—</span>
          ) : (
            <div className="flex flex-col gap-1.5">
              {state.crossCuttingThemes.map((theme) => (
                <div key={theme.themeId} className="rounded-md border p-2">
                  <Badge variant="secondary">
                    {crossCuttingThemeLabels.get(theme.themeId) ?? theme.themeId}
                  </Badge>
                  <p className="mt-1 text-foreground">{theme.explanation || "—"}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        <ListField label="Pedagogical Strategies" values={state.pedagogicalStrategies} />
        <ListField label="Teaching & Learning Resources" values={state.teachingLearningResources} />
        <ListField label="Keywords" values={state.keywords} />
      </Section>

      <Section title="Differentiation & Pedagogy">
        {DIFFERENTIATION_FIELDS.map((field) => (
          <Field key={field.key} label={field.label} value={state.differentiation[field.key]} />
        ))}
        <ListField label="Learning Tasks" values={state.learningTasks} />
        <ListField label="Pedagogical Exemplars" values={state.pedagogicalExemplars} />
      </Section>

      <Section title="Main Lesson">
        {state.lessonActivities.length === 0 ? (
          <span className="text-muted-foreground">No lesson activities added.</span>
        ) : (
          state.lessonActivities.map((activity) => (
            <div key={activity.key} className="rounded-md border p-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {LESSON_ACTIVITY_STAGE_OPTIONS.find((s) => s.value === activity.stage)
                      ?.label ?? activity.stage}
                  </Badge>
                  <span className="font-medium text-foreground">{activity.label}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {activity.durationMinutes} min
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                <strong>Teacher:</strong> {activity.teacherActivity}
              </p>
              <p className="text-xs text-muted-foreground">
                <strong>Learner:</strong> {activity.learnerActivity}
              </p>
            </div>
          ))
        )}
      </Section>

      <Section title="Assessment">
        {state.assessments.length === 0 ? (
          <span className="text-muted-foreground">No assessments added.</span>
        ) : (
          state.assessments.map((assessment) => (
            <div key={assessment.key} className="rounded-md border p-2.5">
              <Badge variant="outline">
                {DOK_LEVEL_OPTIONS.find((d) => d.value === assessment.dokLevel)?.label ??
                  assessment.dokLevel}
              </Badge>
              <p className="mt-1 text-foreground">{assessment.description}</p>
            </div>
          ))
        )}
      </Section>
    </div>
  );
}

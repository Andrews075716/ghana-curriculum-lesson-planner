import { getCurrentTeacherId } from "@/server/auth/session";
import { getPlannerDraftForTeacher, startPlannerDraft } from "@/server/services/planner.service";
import { getLearningIndicatorPath } from "@/server/services/curriculum.service";
import { WizardShell } from "@/components/planner/wizard/WizardShell";
import { createInitialWizardState, type WizardState } from "@/components/planner/wizard/types";

// This page always creates or loads a live draft — never statically cached.
export const dynamic = "force-dynamic";

async function applyCurriculumPath(state: WizardState, learningIndicatorId: string) {
  try {
    const path = await getLearningIndicatorPath(learningIndicatorId);
    state.subjectId = path.subjectId;
    state.classLevelId = path.classLevelId;
    state.strandId = path.strandId;
    state.subStrandId = path.subStrandId;
    state.contentStandardId = path.contentStandardId;
    state.learningOutcomeId = path.learningOutcomeId;
    state.learningIndicatorId = path.learningIndicatorId;
  } catch {
    // Unknown indicator id — ignore and leave curriculum fields blank.
  }
}

export default async function NewPlannerPage({
  searchParams,
}: {
  searchParams: Promise<{ draftId?: string; indicatorId?: string }>;
}) {
  const { draftId, indicatorId } = await searchParams;
  const teacherId = await getCurrentTeacherId();

  if (!teacherId) {
    return (
      <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
        Your account doesn&apos;t have a teacher profile, so there&apos;s nothing to plan against
        yet. Contact an administrator if you believe this is a mistake.
      </div>
    );
  }

  const state = createInitialWizardState();
  let plannerId: string | null = null;
  let alreadyPublished = false;

  if (draftId) {
    try {
      const draft = await getPlannerDraftForTeacher(draftId, teacherId);
      plannerId = draft.id;
      alreadyPublished = draft.status === "PUBLISHED";

      state.classLevelLabel = draft.classSection ?? "";
      state.term = draft.term ?? "";
      state.weekNumber = draft.weekNumber ? String(draft.weekNumber) : "";
      state.durationMinutes = draft.durationMinutes ? String(draft.durationMinutes) : "";
      state.essentialQuestions = draft.essentialQuestions;
      state.crossCuttingThemes = draft.crossCuttingThemes;
      state.pedagogicalStrategies = draft.pedagogicalStrategies;
      state.teachingLearningResources = draft.teachingLearningResources;
      state.keywords = draft.keywords;
      state.differentiation = draft.differentiation;
      state.learningTasks = draft.learningTasks;
      state.pedagogicalExemplars = draft.pedagogicalExemplars;

      if (draft.lesson) {
        state.lessonNumber = String(draft.lesson.sequence);
        state.lessonDate = draft.lesson.date ?? "";
        state.lessonActivities = draft.lesson.lessonActivities.map((a) => ({
          key: crypto.randomUUID(),
          stage: a.stage,
          label: a.label,
          durationMinutes: String(a.durationMinutes),
          teacherActivity: a.teacherActivity,
          learnerActivity: a.learnerActivity,
        }));
        state.assessments = draft.lesson.assessments.map((a) => ({
          key: crypto.randomUUID(),
          dokLevel: a.dokLevel,
          description: a.description,
        }));
      }

      if (draft.learningIndicatorId) {
        await applyCurriculumPath(state, draft.learningIndicatorId);
      }
    } catch {
      // Unknown/foreign draft id — fall through to starting a fresh draft below.
      plannerId = null;
    }
  }

  if (!plannerId) {
    plannerId = await startPlannerDraft(teacherId);
    if (indicatorId) {
      await applyCurriculumPath(state, indicatorId);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Create Lesson Planner</h1>
        <p className="text-sm text-muted-foreground">
          Work through each step below — your progress saves automatically.
        </p>
      </div>
      <WizardShell
        plannerId={plannerId}
        initialState={state}
        alreadyPublished={alreadyPublished}
      />
    </div>
  );
}

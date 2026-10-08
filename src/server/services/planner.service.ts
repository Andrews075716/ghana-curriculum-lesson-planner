import { getCurrentAcademicPeriod } from "@/lib/academic-period";
import { NotFoundError, ValidationError } from "@/server/errors/app-error";
import {
  PlannerDraftUpdateSchema,
  PlannerListQuerySchema,
  PlannerPublishSchema,
  type PlannerDraftUpdate,
} from "@/lib/validation/planner.schema";
import {
  countDistinctSubjects,
  countDraftPlannersByTeacher,
  countPlannersByTeacher,
  countPlannersByTeacherAndPeriod,
  createDraftPlanner,
  deletePlanner,
  duplicatePlanner,
  getPlannerDraft,
  getPlannerPrintView,
  getRecentPlanners,
  getUpcomingLessons,
  listPlannersForTeacher,
  publishPlanner,
  updatePlannerDraft,
  type PlannerDraftDetail,
  type PlannerListRow,
  type PlannerPrintView,
  type RecentPlannerRow,
  type UpcomingLessonRow,
} from "@/server/repositories/planner.repository";
import { countActiveClassesByTeacher } from "@/server/repositories/class.repository";
import {
  assertLearningIndicatorAuthorized,
  assertProfileReadyForPlanning,
} from "@/server/services/planner-authorization.service";

export interface DashboardStats {
  totalPlanners: number;
  draftPlanners: number;
  plannersThisTerm: number;
  classes: number;
  subjects: number;
}

export interface DashboardOverview {
  stats: DashboardStats;
  recentPlanners: RecentPlannerRow[];
  upcomingLessons: UpcomingLessonRow[];
}

const EMPTY_OVERVIEW: DashboardOverview = {
  stats: { totalPlanners: 0, draftPlanners: 0, plannersThisTerm: 0, classes: 0, subjects: 0 },
  recentPlanners: [],
  upcomingLessons: [],
};

/**
 * Assembles everything the teacher dashboard needs in one call. Returns the
 * (real, empty) zero-state when no teacher profile is resolved for the
 * current session (see server/auth/session.ts's `getCurrentTeacherId`)
 * rather than erroring, since that isn't a data error the dashboard
 * should surface as one.
 */
export async function getDashboardOverview(
  teacherId: string | null,
): Promise<DashboardOverview> {
  if (!teacherId) {
    return EMPTY_OVERVIEW;
  }

  const currentPeriod = getCurrentAcademicPeriod();

  const [totalPlanners, draftPlanners, plannersThisTerm, classes, subjects, recentPlanners, upcomingLessons] =
    await Promise.all([
      countPlannersByTeacher(teacherId),
      countDraftPlannersByTeacher(teacherId),
      countPlannersByTeacherAndPeriod(teacherId, currentPeriod),
      countActiveClassesByTeacher(teacherId),
      countDistinctSubjects(teacherId),
      getRecentPlanners(teacherId, 5),
      getUpcomingLessons(teacherId, currentPeriod, 5),
    ]);

  return {
    stats: { totalPlanners, draftPlanners, plannersThisTerm, classes, subjects },
    recentPlanners,
    upcomingLessons,
  };
}

// --- Create Planner wizard (draft CRUD) -----------------------------------

/**
 * Starts a new draft planner, immediately persisted so autosave has
 * something to save against. Requires a complete teaching profile (at
 * least one registered subject AND one registered class level) — a
 * teacher with no declared scope has nothing authorised to plan against
 * yet. Does not restrict which authorised subject/class level the draft
 * ends up using; that's enforced per-selection in `saveDraftStep`.
 */
export async function startPlannerDraft(teacherId: string): Promise<string> {
  await assertProfileReadyForPlanning(teacherId);
  const { academicYear } = getCurrentAcademicPeriod();
  return createDraftPlanner(teacherId, academicYear);
}

export async function getPlannerDraftForTeacher(
  id: string,
  teacherId: string,
): Promise<PlannerDraftDetail> {
  const draft = await getPlannerDraft(id, teacherId);
  if (!draft) {
    throw new NotFoundError("Planner draft not found.");
  }
  return draft;
}

/**
 * Applies an autosave payload. Lenient by design — every field is optional,
 * matching whichever step(s) the client currently has data for. Shape is
 * still validated (types, lengths, enums) even though completeness isn't
 * required until publish.
 */
export async function saveDraftStep(
  id: string,
  teacherId: string,
  rawData: unknown,
): Promise<void> {
  const existing = await getPlannerDraft(id, teacherId);
  if (!existing) {
    throw new NotFoundError("Planner draft not found.");
  }
  if (existing.status === "PUBLISHED") {
    throw new ValidationError("This planner has already been published and can no longer be edited.");
  }

  const parsed = PlannerDraftUpdateSchema.safeParse(rawData);
  if (!parsed.success) {
    throw new ValidationError("Invalid draft data.", { cause: parsed.error });
  }

  // Autosave resends the full wizard state on every call, including an
  // unchanged `learningIndicatorId` — so only a genuine change of curriculum
  // assignment is checked against the teacher's authorised subjects/class
  // levels. This is what lets a teacher keep editing a draft's other content
  // (and publish it) even if their profile's subjects/class levels change
  // later, without re-litigating an assignment that was already authorised
  // when it was made. Clearing the assignment (new value `null`) is also
  // never blocked — only acquiring a new, different, non-null assignment is.
  const incomingLearningIndicatorId = parsed.data.learningIndicatorId;
  const isNewCurriculumAssignment =
    incomingLearningIndicatorId !== undefined &&
    incomingLearningIndicatorId !== null &&
    incomingLearningIndicatorId !== existing.learningIndicatorId;

  if (isNewCurriculumAssignment) {
    await assertLearningIndicatorAuthorized(teacherId, incomingLearningIndicatorId);
  }

  await updatePlannerDraft(id, teacherId, parsed.data as PlannerDraftUpdate);
}

/**
 * Finalizes a draft: re-validates the full required shape (the wizard's
 * per-step checks are a UX convenience, not the source of truth) and flips
 * status to PUBLISHED. Throws ValidationError naming what's still missing.
 */
export async function publishPlannerDraft(id: string, teacherId: string): Promise<void> {
  const draft = await getPlannerDraft(id, teacherId);
  if (!draft) {
    throw new NotFoundError("Planner draft not found.");
  }

  const parsed = PlannerPublishSchema.safeParse({
    classSection: draft.classSection,
    term: draft.term,
    weekNumber: draft.weekNumber,
    durationMinutes: draft.durationMinutes,
    learningIndicatorId: draft.learningIndicatorId,
    lessonActivities: draft.lesson?.lessonActivities ?? [],
    assessments: draft.lesson?.assessments ?? [],
  });

  if (!parsed.success) {
    const missing = Object.keys(parsed.error.flatten().fieldErrors).join(", ");
    throw new ValidationError(
      `This planner isn't complete enough to save. Missing or invalid: ${missing}.`,
      { cause: parsed.error },
    );
  }

  const published = await publishPlanner(id, teacherId);
  if (!published) {
    throw new NotFoundError("Planner draft not found.");
  }
}

/** Fully-resolved read for the printable planner preview (draft or published). */
export async function getPlannerPrintViewForTeacher(
  id: string,
  teacherId: string,
): Promise<PlannerPrintView> {
  const view = await getPlannerPrintView(id, teacherId);
  if (!view) {
    throw new NotFoundError("Planner not found.");
  }
  return view;
}

// --- My Planners (list / search / filter / delete / duplicate) -----------

export async function getMyPlanners(teacherId: string, rawQuery: unknown): Promise<PlannerListRow[]> {
  const parsed = PlannerListQuerySchema.safeParse(rawQuery);
  if (!parsed.success) {
    throw new ValidationError("Invalid search/filter parameters.", { cause: parsed.error });
  }
  return listPlannersForTeacher(teacherId, parsed.data);
}

export async function deletePlannerForTeacher(id: string, teacherId: string): Promise<void> {
  const deleted = await deletePlanner(id, teacherId);
  if (!deleted) {
    throw new NotFoundError("Planner not found.");
  }
}

/**
 * Returns the id of the newly created copy. Duplicating into a new planner
 * requires current authorisation for the source's curriculum assignment
 * (not just historical authorisation at the time the source was created) —
 * this creates a brand-new planner, not an edit of existing content.
 */
export async function duplicatePlannerForTeacher(id: string, teacherId: string): Promise<string> {
  const source = await getPlannerDraft(id, teacherId);
  if (!source) {
    throw new NotFoundError("Planner not found.");
  }
  if (source.learningIndicatorId) {
    await assertLearningIndicatorAuthorized(teacherId, source.learningIndicatorId);
  }

  const newId = await duplicatePlanner(id, teacherId);
  if (!newId) {
    throw new NotFoundError("Planner not found.");
  }
  return newId;
}

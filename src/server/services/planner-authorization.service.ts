import "server-only";
import { ForbiddenError } from "@/server/errors/app-error";
import { getTeacherAuthorizedCurriculumIds } from "@/server/repositories/curriculum.repository";
import { getLearningIndicatorPath } from "@/server/services/curriculum.service";

/**
 * The single server-side gate for which curriculum a teacher may assign to a
 * planner — see docs audit "Phase 0: individual-teacher restrictions".
 * Independent teachers are scoped by their own `TeacherProfileSubject` /
 * `TeacherProfileClassLevel` selections (subject and class level are
 * independent axes, not paired assignments — that pairing is deferred to
 * the future `TeachingAssignment` model for school-managed teachers).
 *
 * Every write path that can set `LessonPlanner.learningIndicatorId` must
 * route through `assertLearningIndicatorAuthorized`; every path that can
 * create a brand-new planner must route through `assertProfileReadyForPlanning`.
 * AI generation and publishing deliberately do NOT call this again — they
 * only ever read a planner's already-validated stored `learningIndicatorId`
 * rather than accepting a fresh one from the client, so they can never be
 * used to bypass this gate.
 */

export interface TeacherAuthorizedCurriculumIds {
  subjectIds: string[];
  classLevelIds: string[];
}

const INCOMPLETE_PROFILE_MESSAGE =
  "Complete your teaching profile to start preparing lesson plans. Select the subjects and SHS levels you teach.";

/** Read-only — the teacher's registered subject/class-level ids, for filtering UI choices and for the checks below. */
export async function getAuthorizedCurriculumIds(
  teacherId: string,
): Promise<TeacherAuthorizedCurriculumIds> {
  return getTeacherAuthorizedCurriculumIds(teacherId);
}

/** Throws unless the teacher has at least one registered subject AND at least one registered class level. */
export async function assertProfileReadyForPlanning(
  teacherId: string,
): Promise<TeacherAuthorizedCurriculumIds> {
  const ids = await getAuthorizedCurriculumIds(teacherId);
  if (ids.subjectIds.length === 0 || ids.classLevelIds.length === 0) {
    throw new ForbiddenError(INCOMPLETE_PROFILE_MESSAGE);
  }
  return ids;
}

/**
 * Throws unless `learningIndicatorId` resolves to a subject AND class level
 * both present in the teacher's registered profile. Also enforces profile
 * completeness (via `assertProfileReadyForPlanning`) as a precondition —
 * an incomplete profile can never authorise any assignment.
 */
export async function assertLearningIndicatorAuthorized(
  teacherId: string,
  learningIndicatorId: string,
): Promise<void> {
  const { subjectIds, classLevelIds } = await assertProfileReadyForPlanning(teacherId);

  const path = await getLearningIndicatorPath(learningIndicatorId);
  if (!subjectIds.includes(path.subjectId) || !classLevelIds.includes(path.classLevelId)) {
    throw new ForbiddenError(
      "This subject or class level isn't part of your teaching profile. Update your profile to plan for it.",
    );
  }
}

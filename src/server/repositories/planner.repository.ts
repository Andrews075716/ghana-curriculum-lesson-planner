import type { LessonActivityStage, PlannerStatus, Prisma, Term } from "@prisma/client";
import { prisma } from "@/server/db/prisma";
import { termsAtOrAfter, type AcademicPeriod } from "@/lib/academic-period";
import type {
  PlannerDraftUpdate,
  LessonActivityInput,
  AssessmentInput,
  CrossCuttingThemeSelection,
  DifferentiationPlanInput,
} from "@/lib/validation/planner.schema";

/** Curriculum context needed to display a planner without duplicating curriculum text. */
export interface PlannerCurriculumContext {
  subjectName: string;
  strandName: string;
}

export interface RecentPlannerRow {
  id: string;
  lessonId: string | null;
  classSection: string | null;
  weekNumber: number | null;
  status: PlannerStatus;
  updatedAt: Date;
  curriculum: PlannerCurriculumContext;
}

export interface UpcomingLessonRow {
  id: string;
  name: string;
  sequence: number;
  planner: {
    id: string;
    classSection: string | null;
    weekNumber: number | null;
    /** Never null in practice — the query only returns planners with a term set. */
    term: Term;
    academicYear: string;
    curriculum: PlannerCurriculumContext;
  };
}

const CURRICULUM_INCLUDE = {
  learningIndicator: {
    include: {
      learningOutcome: {
        include: {
          contentStandard: {
            include: {
              subStrand: {
                include: {
                  strand: { include: { subject: true } },
                },
              },
            },
          },
        },
      },
    },
  },
} as const;

const NO_CURRICULUM_CONTEXT: PlannerCurriculumContext = {
  subjectName: "No subject selected",
  strandName: "No curriculum selected yet",
};

function extractCurriculumContext(
  learningIndicator: {
    learningOutcome: {
      contentStandard: {
        subStrand: {
          strand: { name: string; subject: { name: string } };
        };
      };
    };
  } | null,
): PlannerCurriculumContext {
  if (!learningIndicator) return NO_CURRICULUM_CONTEXT;
  const strand = learningIndicator.learningOutcome.contentStandard.subStrand.strand;
  return { subjectName: strand.subject.name, strandName: strand.name };
}

// --- Dashboard reads -----------------------------------------------------

export async function countPlannersByTeacher(teacherId: string): Promise<number> {
  return prisma.lessonPlanner.count({ where: { teacherId } });
}

export async function countPlannersByTeacherAndPeriod(
  teacherId: string,
  period: AcademicPeriod,
): Promise<number> {
  return prisma.lessonPlanner.count({
    where: {
      teacherId,
      term: period.term,
      academicYear: period.academicYear,
    },
  });
}

export async function countDraftPlannersByTeacher(teacherId: string): Promise<number> {
  return prisma.lessonPlanner.count({ where: { teacherId, status: "DRAFT" } });
}

export async function countDistinctSubjects(teacherId: string): Promise<number> {
  const planners = await prisma.lessonPlanner.findMany({
    where: { teacherId, learningIndicatorId: { not: null } },
    select: {
      learningIndicator: {
        select: {
          learningOutcome: {
            select: {
              contentStandard: {
                select: {
                  subStrand: {
                    select: { strand: { select: { subjectId: true } } },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  const subjectIds = new Set(
    planners
      .map((p) => p.learningIndicator?.learningOutcome.contentStandard.subStrand.strand.subjectId)
      .filter((id): id is string => Boolean(id)),
  );
  return subjectIds.size;
}

export async function getRecentPlanners(
  teacherId: string,
  limit: number,
): Promise<RecentPlannerRow[]> {
  const planners = await prisma.lessonPlanner.findMany({
    where: { teacherId },
    orderBy: { updatedAt: "desc" },
    take: limit,
    include: {
      ...CURRICULUM_INCLUDE,
      lessons: { orderBy: { sequence: "asc" }, take: 1, select: { id: true } },
    },
  });

  return planners.map((planner) => ({
    id: planner.id,
    lessonId: planner.lessons[0]?.id ?? null,
    classSection: planner.classSection,
    weekNumber: planner.weekNumber,
    status: planner.status,
    updatedAt: planner.updatedAt,
    curriculum: extractCurriculumContext(planner.learningIndicator),
  }));
}

/**
 * Lessons from the teacher's planners at or after the current academic
 * period, soonest first. There's no dedicated calendar/date field on
 * LessonPlanner, so "upcoming" is approximated by (academicYear, term,
 * week, lesson sequence) ordering relative to `currentPeriod`. Planners
 * with no term set yet (early drafts) are naturally excluded.
 */
export async function getUpcomingLessons(
  teacherId: string,
  currentPeriod: AcademicPeriod,
  limit: number,
): Promise<UpcomingLessonRow[]> {
  const lessons = await prisma.lesson.findMany({
    where: {
      planner: {
        teacherId,
        OR: [
          { academicYear: { gt: currentPeriod.academicYear } },
          {
            academicYear: currentPeriod.academicYear,
            term: { in: termsAtOrAfter(currentPeriod.term) },
          },
        ],
      },
    },
    include: {
      planner: { include: CURRICULUM_INCLUDE },
    },
  });

  return lessons
    .map((lesson) => ({
      id: lesson.id,
      name: lesson.name,
      sequence: lesson.sequence,
      planner: {
        id: lesson.planner.id,
        classSection: lesson.planner.classSection,
        weekNumber: lesson.planner.weekNumber,
        // Non-null: the WHERE clause above only matches planners with a term set.
        term: lesson.planner.term!,
        academicYear: lesson.planner.academicYear,
        curriculum: extractCurriculumContext(lesson.planner.learningIndicator),
      },
    }))
    .sort((a, b) => {
      if (a.planner.academicYear !== b.planner.academicYear) {
        return a.planner.academicYear.localeCompare(b.planner.academicYear);
      }
      if (a.planner.term !== b.planner.term) {
        return a.planner.term.localeCompare(b.planner.term);
      }
      if (a.planner.weekNumber !== b.planner.weekNumber) {
        return (a.planner.weekNumber ?? 0) - (b.planner.weekNumber ?? 0);
      }
      return a.sequence - b.sequence;
    })
    .slice(0, limit);
}

// --- List / search / filter (My Planners) ---------------------------------

export interface PlannerListRow {
  id: string;
  lessonId: string | null;
  lessonDate: Date | null;
  classSection: string | null;
  term: Term | null;
  weekNumber: number | null;
  durationMinutes: number | null;
  status: PlannerStatus;
  updatedAt: Date;
  topic: string;
  curriculum: PlannerCurriculumContext;
  subStrandName: string | null;
}

export interface PlannerListFilters {
  search?: string;
  subjectId?: string;
  classLevelId?: string;
  term?: Term;
  status?: PlannerStatus;
}

function plannerListWhere(teacherId: string, filters: PlannerListFilters): Prisma.LessonPlannerWhereInput {
  const where: Prisma.LessonPlannerWhereInput = { teacherId };

  if (filters.term) where.term = filters.term;
  if (filters.status) where.status = filters.status;
  if (filters.subjectId || filters.classLevelId) {
    where.learningIndicator = {
      learningOutcome: {
        contentStandard: {
          subStrand: {
            strand: {
              ...(filters.subjectId ? { subjectId: filters.subjectId } : {}),
              ...(filters.classLevelId ? { classLevelId: filters.classLevelId } : {}),
            },
          },
        },
      },
    };
  }
  if (filters.search?.trim()) {
    const q = filters.search.trim();
    where.OR = [
      { classSection: { contains: q, mode: "insensitive" } },
      { learningIndicator: { description: { contains: q, mode: "insensitive" } } },
      {
        learningIndicator: {
          learningOutcome: { description: { contains: q, mode: "insensitive" } },
        },
      },
      {
        learningIndicator: {
          learningOutcome: {
            contentStandard: {
              OR: [
                { description: { contains: q, mode: "insensitive" } },
                { subStrand: { name: { contains: q, mode: "insensitive" } } },
                { subStrand: { strand: { name: { contains: q, mode: "insensitive" } } } },
              ],
            },
          },
        },
      },
    ];
  }
  return where;
}

/** Owner-scoped, filtered, most-recently-updated-first list of a teacher's planners, for the "My Planners" page. */
export async function listPlannersForTeacher(
  teacherId: string,
  filters: PlannerListFilters,
): Promise<PlannerListRow[]> {
  const planners = await prisma.lessonPlanner.findMany({
    where: plannerListWhere(teacherId, filters),
    orderBy: { updatedAt: "desc" },
    include: {
      ...CURRICULUM_INCLUDE,
      lessons: { orderBy: { sequence: "asc" }, take: 1, select: { id: true, date: true } },
    },
  });

  return planners.map((planner) => {
    const subStrand = planner.learningIndicator?.learningOutcome.contentStandard.subStrand ?? null;
    return {
      id: planner.id,
      lessonId: planner.lessons[0]?.id ?? null,
      lessonDate: planner.lessons[0]?.date ?? null,
      classSection: planner.classSection,
      term: planner.term,
      weekNumber: planner.weekNumber,
      durationMinutes: planner.durationMinutes,
      status: planner.status,
      updatedAt: planner.updatedAt,
      topic: planner.learningIndicator?.description ?? "No topic selected yet",
      curriculum: extractCurriculumContext(planner.learningIndicator),
      subStrandName: subStrand?.name ?? null,
    };
  });
}

/** Deletes a planner (and, via cascade, every child row) — only if owned by `teacherId`. Returns false if not found/not owned, never throws for that case. */
export async function deletePlanner(id: string, teacherId: string): Promise<boolean> {
  const result = await prisma.lessonPlanner.deleteMany({ where: { id, teacherId } });
  return result.count > 0;
}

/**
 * Creates a full copy of a planner (always as a new DRAFT, regardless of the
 * source's status) — every child row (lists, differentiation plan,
 * cross-cutting themes, the lesson, its activities and assessments).
 * Reflection is deliberately NOT copied — it describes how the *original*
 * lesson actually went, not the new one.
 */
export async function duplicatePlanner(id: string, teacherId: string): Promise<string | null> {
  const source = await prisma.lessonPlanner.findFirst({
    where: { id, teacherId },
    include: {
      essentialQuestions: { orderBy: { sequence: "asc" } },
      pedagogicalStrategies: { orderBy: { sequence: "asc" } },
      teachingLearningResources: { orderBy: { sequence: "asc" } },
      keywords: { orderBy: { sequence: "asc" } },
      differentiationPlan: true,
      learningTasks: { orderBy: { sequence: "asc" } },
      pedagogicalExemplars: { orderBy: { sequence: "asc" } },
      crossCuttingThemes: true,
      lessons: {
        orderBy: { sequence: "asc" },
        take: 1,
        include: { activities: { orderBy: { sequence: "asc" } }, assessments: { orderBy: { sequence: "asc" } } },
      },
    },
  });
  if (!source) return null;

  const newId = await prisma.$transaction(async (tx) => {
    const copy = await tx.lessonPlanner.create({
      data: {
        teacherId,
        academicYear: source.academicYear,
        term: source.term,
        weekNumber: source.weekNumber,
        durationMinutes: source.durationMinutes,
        classSection: source.classSection,
        learningIndicatorId: source.learningIndicatorId,
        status: "DRAFT",
      },
      select: { id: true },
    });

    if (source.essentialQuestions.length) {
      await tx.essentialQuestion.createMany({
        data: source.essentialQuestions.map((r) => ({ plannerId: copy.id, text: r.text, sequence: r.sequence })),
      });
    }
    if (source.pedagogicalStrategies.length) {
      await tx.pedagogicalStrategy.createMany({
        data: source.pedagogicalStrategies.map((r) => ({ plannerId: copy.id, text: r.text, sequence: r.sequence })),
      });
    }
    if (source.teachingLearningResources.length) {
      await tx.teachingLearningResource.createMany({
        data: source.teachingLearningResources.map((r) => ({
          plannerId: copy.id,
          text: r.text,
          sequence: r.sequence,
        })),
      });
    }
    if (source.keywords.length) {
      await tx.keyword.createMany({
        data: source.keywords.map((r) => ({ plannerId: copy.id, text: r.text, sequence: r.sequence })),
      });
    }
    if (source.learningTasks.length) {
      await tx.learningTask.createMany({
        data: source.learningTasks.map((r) => ({ plannerId: copy.id, text: r.text, sequence: r.sequence })),
      });
    }
    if (source.pedagogicalExemplars.length) {
      await tx.pedagogicalExemplar.createMany({
        data: source.pedagogicalExemplars.map((r) => ({ plannerId: copy.id, text: r.text, sequence: r.sequence })),
      });
    }
    if (source.crossCuttingThemes.length) {
      await tx.lessonPlannerCrossCuttingTheme.createMany({
        data: source.crossCuttingThemes.map((r) => ({
          plannerId: copy.id,
          themeId: r.themeId,
          explanation: r.explanation,
        })),
      });
    }
    if (source.differentiationPlan) {
      const { plannerId: _omit, ...fields } = source.differentiationPlan;
      await tx.differentiationPlan.create({ data: { plannerId: copy.id, ...fields } });
    }

    const sourceLesson = source.lessons[0];
    const newLesson = await tx.lesson.create({
      data: {
        plannerId: copy.id,
        name: sourceLesson?.name ?? "Lesson 1",
        sequence: sourceLesson?.sequence ?? 1,
        date: sourceLesson?.date ?? null,
      },
      select: { id: true },
    });

    if (sourceLesson?.activities.length) {
      await tx.lessonActivity.createMany({
        data: sourceLesson.activities.map((a) => ({
          lessonId: newLesson.id,
          stage: a.stage,
          label: a.label,
          sequence: a.sequence,
          durationMinutes: a.durationMinutes,
          teacherActivity: a.teacherActivity,
          learnerActivity: a.learnerActivity,
        })),
      });
    }
    if (sourceLesson?.assessments.length) {
      await tx.assessment.createMany({
        data: sourceLesson.assessments.map((a) => ({
          plannerId: copy.id,
          lessonId: newLesson.id,
          dokLevel: a.dokLevel,
          description: a.description,
          sequence: a.sequence,
        })),
      });
    }

    return copy.id;
  });

  return newId;
}

// --- Draft CRUD (Create Planner wizard) -----------------------------------

export async function createDraftPlanner(
  teacherId: string,
  academicYear: string,
): Promise<string> {
  const planner = await prisma.lessonPlanner.create({
    data: {
      teacherId,
      academicYear,
      status: "DRAFT",
      lessons: { create: { name: "Lesson 1", sequence: 1 } },
    },
    select: { id: true },
  });
  return planner.id;
}

export interface PlannerDraftDetail {
  id: string;
  status: PlannerStatus;
  classSection: string | null;
  term: Term | null;
  weekNumber: number | null;
  durationMinutes: number | null;
  learningIndicatorId: string | null;
  essentialQuestions: string[];
  crossCuttingThemes: CrossCuttingThemeSelection[];
  pedagogicalStrategies: string[];
  teachingLearningResources: string[];
  keywords: string[];
  differentiation: DifferentiationPlanInput;
  learningTasks: string[];
  pedagogicalExemplars: string[];
  lesson: {
    id: string;
    sequence: number;
    date: string | null;
    lessonActivities: LessonActivityInput[];
    assessments: AssessmentInput[];
  } | null;
}

const EMPTY_DIFFERENTIATION_PLAN: DifferentiationPlanInput = {
  mixedAbilityGrouping: "",
  scaffoldSupport: "",
  extensionChallenge: "",
  resourceAdaptation: "",
  learningTaskDifferentiation: "",
  teacherPeerSupport: "",
  additionalNotes: "",
};

export async function getPlannerDraft(
  id: string,
  teacherId: string,
): Promise<PlannerDraftDetail | null> {
  const planner = await prisma.lessonPlanner.findFirst({
    where: { id, teacherId },
    include: {
      essentialQuestions: { orderBy: { sequence: "asc" } },
      pedagogicalStrategies: { orderBy: { sequence: "asc" } },
      teachingLearningResources: { orderBy: { sequence: "asc" } },
      keywords: { orderBy: { sequence: "asc" } },
      differentiationPlan: true,
      learningTasks: { orderBy: { sequence: "asc" } },
      pedagogicalExemplars: { orderBy: { sequence: "asc" } },
      crossCuttingThemes: { select: { themeId: true, explanation: true } },
      lessons: {
        orderBy: { sequence: "asc" },
        take: 1,
        include: {
          activities: { orderBy: { sequence: "asc" } },
          assessments: { orderBy: { sequence: "asc" } },
        },
      },
    },
  });

  if (!planner) return null;

  const lesson = planner.lessons[0] ?? null;
  const lessonActivities =
    lesson?.activities.map((a) => ({
      stage: a.stage,
      label: a.label,
      sequence: a.sequence,
      durationMinutes: a.durationMinutes,
      teacherActivity: a.teacherActivity,
      learnerActivity: a.learnerActivity,
    })) ?? [];

  return {
    id: planner.id,
    status: planner.status,
    classSection: planner.classSection,
    term: planner.term,
    weekNumber: planner.weekNumber,
    durationMinutes: planner.durationMinutes,
    learningIndicatorId: planner.learningIndicatorId,
    essentialQuestions: planner.essentialQuestions.map((r) => r.text),
    crossCuttingThemes: planner.crossCuttingThemes.map((r) => ({
      themeId: r.themeId,
      explanation: r.explanation ?? "",
    })),
    pedagogicalStrategies: planner.pedagogicalStrategies.map((r) => r.text),
    teachingLearningResources: planner.teachingLearningResources.map((r) => r.text),
    keywords: planner.keywords.map((r) => r.text),
    differentiation: planner.differentiationPlan
      ? {
          mixedAbilityGrouping: planner.differentiationPlan.mixedAbilityGrouping ?? "",
          scaffoldSupport: planner.differentiationPlan.scaffoldSupport ?? "",
          extensionChallenge: planner.differentiationPlan.extensionChallenge ?? "",
          resourceAdaptation: planner.differentiationPlan.resourceAdaptation ?? "",
          learningTaskDifferentiation:
            planner.differentiationPlan.learningTaskDifferentiation ?? "",
          teacherPeerSupport: planner.differentiationPlan.teacherPeerSupport ?? "",
          additionalNotes: planner.differentiationPlan.additionalNotes ?? "",
        }
      : EMPTY_DIFFERENTIATION_PLAN,
    learningTasks: planner.learningTasks.map((r) => r.text),
    pedagogicalExemplars: planner.pedagogicalExemplars.map((r) => r.text),
    lesson: lesson && {
      id: lesson.id,
      sequence: lesson.sequence,
      date: lesson.date ? lesson.date.toISOString().slice(0, 10) : null,
      lessonActivities,
      assessments: lesson.assessments.map((a) => ({
        dokLevel: a.dokLevel,
        description: a.description,
        sequence: a.sequence,
      })),
    },
  };
}

function toRows(plannerId: string, values: string[]) {
  return values.map((text, index) => ({ plannerId, text, sequence: index + 1 }));
}

export async function updatePlannerDraft(
  id: string,
  teacherId: string,
  data: PlannerDraftUpdate,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const existing = await tx.lessonPlanner.findFirst({
      where: { id, teacherId },
      select: { id: true, lessons: { orderBy: { sequence: "asc" }, take: 1, select: { id: true } } },
    });
    if (!existing) return;

    const plannerScalars: Prisma.LessonPlannerUpdateInput = {};
    if (data.classSection !== undefined) plannerScalars.classSection = data.classSection;
    if (data.term !== undefined) plannerScalars.term = data.term;
    if (data.weekNumber !== undefined) plannerScalars.weekNumber = data.weekNumber;
    if (data.durationMinutes !== undefined) plannerScalars.durationMinutes = data.durationMinutes;
    if (data.learningIndicatorId !== undefined) {
      plannerScalars.learningIndicator = data.learningIndicatorId
        ? { connect: { id: data.learningIndicatorId } }
        : { disconnect: true };
    }
    if (Object.keys(plannerScalars).length > 0) {
      await tx.lessonPlanner.update({ where: { id }, data: plannerScalars });
    }

    if (data.essentialQuestions !== undefined) {
      await tx.essentialQuestion.deleteMany({ where: { plannerId: id } });
      if (data.essentialQuestions.length > 0) {
        await tx.essentialQuestion.createMany({ data: toRows(id, data.essentialQuestions) });
      }
    }
    if (data.pedagogicalStrategies !== undefined) {
      await tx.pedagogicalStrategy.deleteMany({ where: { plannerId: id } });
      if (data.pedagogicalStrategies.length > 0) {
        await tx.pedagogicalStrategy.createMany({ data: toRows(id, data.pedagogicalStrategies) });
      }
    }
    if (data.teachingLearningResources !== undefined) {
      await tx.teachingLearningResource.deleteMany({ where: { plannerId: id } });
      if (data.teachingLearningResources.length > 0) {
        await tx.teachingLearningResource.createMany({
          data: toRows(id, data.teachingLearningResources),
        });
      }
    }
    if (data.keywords !== undefined) {
      await tx.keyword.deleteMany({ where: { plannerId: id } });
      if (data.keywords.length > 0) {
        await tx.keyword.createMany({ data: toRows(id, data.keywords) });
      }
    }
    if (data.differentiation !== undefined) {
      await tx.differentiationPlan.upsert({
        where: { plannerId: id },
        create: { plannerId: id, ...data.differentiation },
        update: data.differentiation,
      });
    }
    if (data.learningTasks !== undefined) {
      await tx.learningTask.deleteMany({ where: { plannerId: id } });
      if (data.learningTasks.length > 0) {
        await tx.learningTask.createMany({ data: toRows(id, data.learningTasks) });
      }
    }
    if (data.pedagogicalExemplars !== undefined) {
      await tx.pedagogicalExemplar.deleteMany({ where: { plannerId: id } });
      if (data.pedagogicalExemplars.length > 0) {
        await tx.pedagogicalExemplar.createMany({ data: toRows(id, data.pedagogicalExemplars) });
      }
    }

    if (data.crossCuttingThemes !== undefined) {
      await tx.lessonPlannerCrossCuttingTheme.deleteMany({ where: { plannerId: id } });
      if (data.crossCuttingThemes.length > 0) {
        await tx.lessonPlannerCrossCuttingTheme.createMany({
          data: data.crossCuttingThemes.map(({ themeId, explanation }) => ({
            plannerId: id,
            themeId,
            explanation,
          })),
        });
      }
    }

    const lessonId = existing.lessons[0]?.id;

    if (data.lessonNumber !== undefined && lessonId) {
      await tx.lesson.update({
        where: { id: lessonId },
        data: { sequence: data.lessonNumber, name: `Lesson ${data.lessonNumber}` },
      });
    }
    if (data.lessonDate !== undefined && lessonId) {
      await tx.lesson.update({
        where: { id: lessonId },
        data: { date: data.lessonDate ? new Date(data.lessonDate) : null },
      });
    }

    if (data.lessonActivities !== undefined && lessonId) {
      await tx.lessonActivity.deleteMany({ where: { lessonId } });
      if (data.lessonActivities.length > 0) {
        await tx.lessonActivity.createMany({
          data: data.lessonActivities.map((activity) => ({
            lessonId,
            stage: activity.stage,
            label: activity.label,
            sequence: activity.sequence,
            durationMinutes: activity.durationMinutes,
            teacherActivity: activity.teacherActivity,
            learnerActivity: activity.learnerActivity,
          })),
        });
      }
    }

    if (data.assessments !== undefined && lessonId) {
      await tx.assessment.deleteMany({ where: { lessonId } });
      if (data.assessments.length > 0) {
        await tx.assessment.createMany({
          data: data.assessments.map((assessment) => ({
            plannerId: id,
            lessonId,
            dokLevel: assessment.dokLevel,
            description: assessment.description,
            sequence: assessment.sequence,
          })),
        });
      }
    }
  });
}

export async function publishPlanner(id: string, teacherId: string): Promise<boolean> {
  const result = await prisma.lessonPlanner.updateMany({
    where: { id, teacherId },
    data: { status: "PUBLISHED" },
  });
  return result.count > 0;
}

// --- Print / full detail view ---------------------------------------------
//
// A read-only, fully-resolved view for the printable planner preview —
// curriculum text (not just IDs), teacher/school identity, and the
// lesson's reflection, none of which the lighter draft-editing view above
// needs.

export interface PlannerPrintActivity {
  stage: LessonActivityStage;
  label: string;
  sequence: number;
  durationMinutes: number;
  teacherActivity: string;
  learnerActivity: string;
}

export interface PlannerPrintReflection {
  whatWentWell: string | null;
  subgroupsCatered: string | null;
  difficulties: string | null;
  indicatorsAchieved: string | null;
  reteachingNeeded: string | null;
  nextLessonChanges: string | null;
  remarks: string | null;
}

export interface PlannerPrintView {
  id: string;
  status: PlannerStatus;
  school: string | null;
  teacherName: string;
  subject: string | null;
  form: string | null;
  term: Term | null;
  weekNumber: number | null;
  durationMinutes: number | null;
  strand: string | null;
  subStrand: string | null;
  contentStandard: string | null;
  learningOutcome: string | null;
  learningIndicator: string | null;
  essentialQuestions: string[];
  crossCuttingThemes: { label: string; explanation: string }[];
  pedagogicalStrategies: string[];
  teachingLearningResources: string[];
  differentiation: DifferentiationPlanInput;
  learningTasks: string[];
  pedagogicalExemplars: string[];
  keywords: string[];
  lesson: {
    id: string;
    sequence: number;
    date: string | null;
    mainActivities: PlannerPrintActivity[];
    closure: PlannerPrintActivity | null;
    assessments: AssessmentInput[];
    reflection: PlannerPrintReflection | null;
  } | null;
}

export async function getPlannerPrintView(
  id: string,
  teacherId: string,
): Promise<PlannerPrintView | null> {
  const planner = await prisma.lessonPlanner.findFirst({
    where: { id, teacherId },
    include: {
      teacher: { include: { user: true, school: true } },
      essentialQuestions: { orderBy: { sequence: "asc" } },
      pedagogicalStrategies: { orderBy: { sequence: "asc" } },
      teachingLearningResources: { orderBy: { sequence: "asc" } },
      keywords: { orderBy: { sequence: "asc" } },
      differentiationPlan: true,
      learningTasks: { orderBy: { sequence: "asc" } },
      pedagogicalExemplars: { orderBy: { sequence: "asc" } },
      crossCuttingThemes: { include: { theme: true } },
      learningIndicator: {
        include: {
          learningOutcome: {
            include: {
              contentStandard: {
                include: {
                  subStrand: {
                    include: {
                      strand: { include: { subject: true } },
                    },
                  },
                },
              },
            },
          },
        },
      },
      lessons: {
        orderBy: { sequence: "asc" },
        take: 1,
        include: {
          activities: { orderBy: { sequence: "asc" } },
          assessments: { orderBy: { sequence: "asc" } },
          reflection: true,
        },
      },
    },
  });

  if (!planner) return null;

  const outcome = planner.learningIndicator?.learningOutcome ?? null;
  const standard = outcome?.contentStandard ?? null;
  const subStrand = standard?.subStrand ?? null;
  const strand = subStrand?.strand ?? null;

  const lesson = planner.lessons[0] ?? null;
  const activities = lesson?.activities ?? [];
  const toActivity = (a: (typeof activities)[number]): PlannerPrintActivity => ({
    stage: a.stage,
    label: a.label,
    sequence: a.sequence,
    durationMinutes: a.durationMinutes,
    teacherActivity: a.teacherActivity,
    learnerActivity: a.learnerActivity,
  });

  return {
    id: planner.id,
    status: planner.status,
    school: planner.teacher.school?.name ?? null,
    teacherName: planner.teacher.user.name,
    subject: strand?.subject.name ?? null,
    form: planner.classSection,
    term: planner.term,
    weekNumber: planner.weekNumber,
    durationMinutes: planner.durationMinutes,
    strand: strand?.name ?? null,
    subStrand: subStrand?.name ?? null,
    contentStandard: standard?.description ?? null,
    learningOutcome: outcome?.description ?? null,
    learningIndicator: planner.learningIndicator?.description ?? null,
    essentialQuestions: planner.essentialQuestions.map((r) => r.text),
    crossCuttingThemes: planner.crossCuttingThemes.map((r) => ({
      label: r.theme.name,
      explanation: r.explanation ?? "",
    })),
    pedagogicalStrategies: planner.pedagogicalStrategies.map((r) => r.text),
    teachingLearningResources: planner.teachingLearningResources.map((r) => r.text),
    differentiation: planner.differentiationPlan
      ? {
          mixedAbilityGrouping: planner.differentiationPlan.mixedAbilityGrouping ?? "",
          scaffoldSupport: planner.differentiationPlan.scaffoldSupport ?? "",
          extensionChallenge: planner.differentiationPlan.extensionChallenge ?? "",
          resourceAdaptation: planner.differentiationPlan.resourceAdaptation ?? "",
          learningTaskDifferentiation:
            planner.differentiationPlan.learningTaskDifferentiation ?? "",
          teacherPeerSupport: planner.differentiationPlan.teacherPeerSupport ?? "",
          additionalNotes: planner.differentiationPlan.additionalNotes ?? "",
        }
      : EMPTY_DIFFERENTIATION_PLAN,
    learningTasks: planner.learningTasks.map((r) => r.text),
    pedagogicalExemplars: planner.pedagogicalExemplars.map((r) => r.text),
    keywords: planner.keywords.map((r) => r.text),
    lesson: lesson && {
      id: lesson.id,
      sequence: lesson.sequence,
      date: lesson.date ? lesson.date.toISOString().slice(0, 10) : null,
      mainActivities: activities.filter((a) => a.stage !== "CLOSURE").map(toActivity),
      closure: (() => {
        const row = activities.find((a) => a.stage === "CLOSURE");
        return row ? toActivity(row) : null;
      })(),
      assessments: lesson.assessments.map((a) => ({
        dokLevel: a.dokLevel,
        description: a.description,
        sequence: a.sequence,
      })),
      reflection: lesson.reflection
        ? {
            whatWentWell: lesson.reflection.whatWentWell,
            subgroupsCatered: lesson.reflection.subgroupsCatered,
            difficulties: lesson.reflection.difficulties,
            indicatorsAchieved: lesson.reflection.indicatorsAchieved,
            reteachingNeeded: lesson.reflection.reteachingNeeded,
            nextLessonChanges: lesson.reflection.nextLessonChanges,
            remarks: lesson.reflection.remarks,
          }
        : null,
    },
  };
}

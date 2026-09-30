import { prisma } from "@/server/db/prisma";
import type { DokLevel, Prisma } from "@prisma/client";

export interface AssessmentRow {
  id: string;
  dokLevel: DokLevel;
  description: string;
  plannerId: string;
  plannerTopic: string;
  classSection: string | null;
  lessonId: string | null;
  lessonName: string | null;
  subjectId: string | null;
  subjectName: string;
  classLevelId: string | null;
  strandId: string | null;
  strandName: string;
  learningIndicatorId: string | null;
  learningIndicatorLabel: string;
}

export interface AssessmentFilters {
  subjectId?: string;
  classLevelId?: string;
  strandId?: string;
  learningIndicatorId?: string;
  dokLevel?: DokLevel;
}

function assessmentWhere(teacherId: string, filters: AssessmentFilters): Prisma.AssessmentWhereInput {
  const plannerWhere: Prisma.LessonPlannerWhereInput = { teacherId };

  if (filters.learningIndicatorId) plannerWhere.learningIndicatorId = filters.learningIndicatorId;
  if (filters.subjectId || filters.classLevelId || filters.strandId) {
    plannerWhere.learningIndicator = {
      learningOutcome: {
        contentStandard: {
          subStrand: {
            strand: {
              ...(filters.subjectId ? { subjectId: filters.subjectId } : {}),
              ...(filters.classLevelId ? { classLevelId: filters.classLevelId } : {}),
              ...(filters.strandId ? { id: filters.strandId } : {}),
            },
          },
        },
      },
    };
  }

  return {
    planner: plannerWhere,
    ...(filters.dokLevel ? { dokLevel: filters.dokLevel } : {}),
  };
}

/** Every assessment across the teacher's planners, most-recently-updated planner first, matching the given filters. */
export async function listAssessmentsForTeacher(
  teacherId: string,
  filters: AssessmentFilters,
): Promise<AssessmentRow[]> {
  const rows = await prisma.assessment.findMany({
    where: assessmentWhere(teacherId, filters),
    orderBy: [{ planner: { updatedAt: "desc" } }, { sequence: "asc" }],
    include: {
      lesson: { select: { id: true, name: true, sequence: true } },
      planner: {
        select: {
          id: true,
          classSection: true,
          learningIndicator: {
            select: {
              id: true,
              description: true,
              learningOutcome: {
                select: {
                  contentStandard: {
                    select: {
                      subStrand: {
                        select: {
                          strand: {
                            select: {
                              id: true,
                              name: true,
                              subjectId: true,
                              classLevelId: true,
                              subject: { select: { name: true } },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  return rows.map((r) => {
    const li = r.planner.learningIndicator;
    const strand = li?.learningOutcome.contentStandard.subStrand.strand;
    return {
      id: r.id,
      dokLevel: r.dokLevel,
      description: r.description,
      plannerId: r.planner.id,
      plannerTopic: li?.description ?? "No topic selected yet",
      classSection: r.planner.classSection,
      lessonId: r.lesson?.id ?? null,
      lessonName: r.lesson ? `Lesson ${r.lesson.sequence}: ${r.lesson.name}` : null,
      subjectId: strand?.subjectId ?? null,
      subjectName: strand?.subject.name ?? "—",
      classLevelId: strand?.classLevelId ?? null,
      strandId: strand?.id ?? null,
      strandName: strand?.name ?? "—",
      learningIndicatorId: li?.id ?? null,
      learningIndicatorLabel: li?.description ?? "No learning indicator selected",
    };
  });
}

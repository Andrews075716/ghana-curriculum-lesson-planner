import { prisma } from "@/server/db/prisma";
import type { ReflectionData, ReflectionInput } from "@/lib/validation/lesson.schema";
import { EMPTY_REFLECTION } from "@/lib/validation/lesson.schema";

/**
 * Data access for Lesson-scoped content — currently just post-lesson
 * Reflection. Every read here is ownership-scoped through
 * `lesson -> planner -> teacherId`, exactly like the planner repository
 * scopes through `planner.teacherId` directly.
 */

export interface LessonDetail {
  id: string;
  plannerId: string;
  sequence: number;
  date: string | null;
  plannerStatus: "DRAFT" | "PUBLISHED";
  subject: string | null;
  classSection: string | null;
  weekNumber: number | null;
  learningIndicator: string | null;
  reflection: ReflectionData;
}

function toReflectionData(row: {
  whatWentWell: string | null;
  subgroupsCatered: string | null;
  difficulties: string | null;
  indicatorsAchieved: string | null;
  reteachingNeeded: string | null;
  nextLessonChanges: string | null;
  remarks: string | null;
} | null): ReflectionData {
  if (!row) return EMPTY_REFLECTION;
  return {
    whatWentWell: row.whatWentWell,
    subgroupsCatered: row.subgroupsCatered,
    difficulties: row.difficulties,
    indicatorsAchieved: row.indicatorsAchieved,
    reteachingNeeded: row.reteachingNeeded,
    nextLessonChanges: row.nextLessonChanges,
    remarks: row.remarks,
  };
}

export async function getLessonDetail(
  plannerId: string,
  lessonId: string,
  teacherId: string,
): Promise<LessonDetail | null> {
  const lesson = await prisma.lesson.findFirst({
    where: { id: lessonId, plannerId, planner: { teacherId } },
    include: {
      reflection: true,
      planner: {
        select: {
          status: true,
          classSection: true,
          weekNumber: true,
          learningIndicator: {
            select: {
              description: true,
              learningOutcome: {
                select: {
                  contentStandard: {
                    select: {
                      subStrand: { select: { strand: { select: { subject: true } } } },
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

  if (!lesson) return null;

  return {
    id: lesson.id,
    plannerId: lesson.plannerId,
    sequence: lesson.sequence,
    date: lesson.date ? lesson.date.toISOString().slice(0, 10) : null,
    plannerStatus: lesson.planner.status,
    subject: lesson.planner.learningIndicator?.learningOutcome.contentStandard.subStrand.strand
      .subject.name ?? null,
    classSection: lesson.planner.classSection,
    weekNumber: lesson.planner.weekNumber,
    learningIndicator: lesson.planner.learningIndicator?.description ?? null,
    reflection: toReflectionData(lesson.reflection),
  };
}

export async function upsertReflection(
  plannerId: string,
  lessonId: string,
  teacherId: string,
  data: ReflectionInput,
): Promise<boolean> {
  const lesson = await prisma.lesson.findFirst({
    where: { id: lessonId, plannerId, planner: { teacherId } },
    select: { id: true },
  });
  if (!lesson) return false;

  await prisma.reflection.upsert({
    where: { lessonId },
    create: { lessonId, ...data },
    update: data,
  });
  return true;
}

/**
 * Previous lessons (same teacher, same subject + class level, excluding
 * the planner currently being written) that already have some reflection
 * content — candidates the teacher can optionally use as AI context for a
 * new lesson. Read-only: nothing here ever touches the source lesson.
 */
/** `{ id, label }` — matches the generic `useCurriculumOptions` client hook's expected option shape. */
export interface ReflectableLessonOption {
  id: string;
  label: string;
}

export async function listPreviousLessonsWithReflection(
  teacherId: string,
  subjectId: string,
  classLevelId: string,
  excludePlannerId: string,
): Promise<ReflectableLessonOption[]> {
  const lessons = await prisma.lesson.findMany({
    where: {
      planner: {
        teacherId,
        id: { not: excludePlannerId },
        learningIndicator: {
          learningOutcome: {
            contentStandard: {
              subStrand: { strand: { subjectId, classLevelId } },
            },
          },
        },
      },
      reflection: { isNot: null },
    },
    include: {
      reflection: true,
      planner: { select: { weekNumber: true, classSection: true } },
    },
    orderBy: { date: "desc" },
    take: 20,
  });

  return lessons
    .filter((lesson) => {
      const r = lesson.reflection;
      if (!r) return false;
      return [
        r.whatWentWell,
        r.subgroupsCatered,
        r.difficulties,
        r.indicatorsAchieved,
        r.reteachingNeeded,
        r.nextLessonChanges,
        r.remarks,
      ].some((v) => (v ?? "").trim() !== "");
    })
    .map((lesson) => {
      const parts = [
        lesson.planner.weekNumber ? `Week ${lesson.planner.weekNumber}` : null,
        `Lesson ${lesson.sequence}`,
        lesson.planner.classSection,
        lesson.date ? lesson.date.toISOString().slice(0, 10) : null,
      ].filter(Boolean);
      return { id: lesson.id, label: parts.join(" · ") };
    });
}

/** Ownership-checked fetch of one lesson's reflection, formatted as prompt-ready text — for AI context only, never for writing back. */
export async function getReflectionTextForAIContext(
  teacherId: string,
  lessonId: string,
): Promise<string | null> {
  const lesson = await prisma.lesson.findFirst({
    where: { id: lessonId, planner: { teacherId } },
    include: { reflection: true },
  });
  if (!lesson?.reflection) return null;

  const r = lesson.reflection;
  const lines = [
    r.whatWentWell ? `What went well: ${r.whatWentWell}` : null,
    r.subgroupsCatered ? `Learner groups catered for: ${r.subgroupsCatered}` : null,
    r.difficulties ? `Difficulties that occurred: ${r.difficulties}` : null,
    r.indicatorsAchieved ? `Learning indicators achieved: ${r.indicatorsAchieved}` : null,
    r.reteachingNeeded ? `Needs reteaching: ${r.reteachingNeeded}` : null,
    r.nextLessonChanges ? `Planned changes for the next lesson: ${r.nextLessonChanges}` : null,
    r.remarks ? `Additional remarks: ${r.remarks}` : null,
  ].filter((line): line is string => Boolean(line));

  return lines.length > 0 ? lines.join("\n") : null;
}

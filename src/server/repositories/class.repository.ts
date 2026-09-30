import { prisma } from "@/server/db/prisma";

export interface ClassRow {
  id: string;
  name: string;
  classLevelId: string;
  classLevelName: string;
  subjectId: string;
  subjectName: string;
  academicYear: string;
  notes: string | null;
  archived: boolean;
  updatedAt: Date;
  plannerCount: number;
}

export interface ClassInput {
  name: string;
  classLevelId: string;
  subjectId: string;
  academicYear: string;
  notes?: string | null;
}

async function plannerCountsBySection(teacherId: string): Promise<Map<string, number>> {
  const rows = await prisma.lessonPlanner.groupBy({
    by: ["classSection"],
    where: { teacherId, classSection: { not: null } },
    _count: { _all: true },
  });
  const map = new Map<string, number>();
  for (const row of rows) {
    if (row.classSection) map.set(row.classSection.trim().toLowerCase(), row._count._all);
  }
  return map;
}

function toRow(
  c: {
    id: string;
    name: string;
    classLevelId: string;
    classLevel: { name: string };
    subjectId: string;
    subject: { name: string };
    academicYear: string;
    notes: string | null;
    archived: boolean;
    updatedAt: Date;
  },
  counts: Map<string, number>,
): ClassRow {
  return {
    id: c.id,
    name: c.name,
    classLevelId: c.classLevelId,
    classLevelName: c.classLevel.name,
    subjectId: c.subjectId,
    subjectName: c.subject.name,
    academicYear: c.academicYear,
    notes: c.notes,
    archived: c.archived,
    updatedAt: c.updatedAt,
    plannerCount: counts.get(c.name.trim().toLowerCase()) ?? 0,
  };
}

/** Active (non-archived) class count, for the dashboard's "Classes" stat. */
export async function countActiveClassesByTeacher(teacherId: string): Promise<number> {
  return prisma.class.count({ where: { teacherId, archived: false } });
}

/** Every class the teacher owns, most-recently-updated first, including archived ones (the UI filters). */
export async function listClassesForTeacher(teacherId: string): Promise<ClassRow[]> {
  const [classes, counts] = await Promise.all([
    prisma.class.findMany({
      where: { teacherId },
      orderBy: { updatedAt: "desc" },
      include: { classLevel: { select: { name: true } }, subject: { select: { name: true } } },
    }),
    plannerCountsBySection(teacherId),
  ]);
  return classes.map((c) => toRow(c, counts));
}

export async function getClassForTeacher(id: string, teacherId: string): Promise<ClassRow | null> {
  const [c, counts] = await Promise.all([
    prisma.class.findFirst({
      where: { id, teacherId },
      include: { classLevel: { select: { name: true } }, subject: { select: { name: true } } },
    }),
    plannerCountsBySection(teacherId),
  ]);
  if (!c) return null;
  return toRow(c, counts);
}

export async function createClass(teacherId: string, input: ClassInput): Promise<string> {
  const created = await prisma.class.create({
    data: {
      teacherId,
      name: input.name,
      classLevelId: input.classLevelId,
      subjectId: input.subjectId,
      academicYear: input.academicYear,
      notes: input.notes ?? null,
    },
    select: { id: true },
  });
  return created.id;
}

/** Returns false (no throw) if the class doesn't exist or isn't owned by this teacher. */
export async function updateClass(
  id: string,
  teacherId: string,
  input: ClassInput,
): Promise<boolean> {
  const result = await prisma.class.updateMany({
    where: { id, teacherId },
    data: {
      name: input.name,
      classLevelId: input.classLevelId,
      subjectId: input.subjectId,
      academicYear: input.academicYear,
      notes: input.notes ?? null,
    },
  });
  return result.count > 0;
}

export async function setClassArchived(
  id: string,
  teacherId: string,
  archived: boolean,
): Promise<boolean> {
  const result = await prisma.class.updateMany({
    where: { id, teacherId },
    data: { archived },
  });
  return result.count > 0;
}

import { prisma } from "@/server/db/prisma";
import type { ResourceType } from "@prisma/client";

export interface ResourceRow {
  id: string;
  title: string;
  type: ResourceType;
  url: string | null;
  description: string | null;
  updatedAt: Date;
  associatedPlanners: { id: string; topic: string }[];
}

export interface ResourceInput {
  title: string;
  type: ResourceType;
  url?: string | null;
  description?: string | null;
}

const PLANNER_TOPIC_INCLUDE = {
  planners: {
    select: {
      planner: {
        select: { id: true, learningIndicator: { select: { description: true } } },
      },
    },
  },
} as const;

function toRow(r: {
  id: string;
  title: string;
  type: ResourceType;
  url: string | null;
  description: string | null;
  updatedAt: Date;
  planners: { planner: { id: string; learningIndicator: { description: string } | null } }[];
}): ResourceRow {
  return {
    id: r.id,
    title: r.title,
    type: r.type,
    url: r.url,
    description: r.description,
    updatedAt: r.updatedAt,
    associatedPlanners: r.planners.map((p) => ({
      id: p.planner.id,
      topic: p.planner.learningIndicator?.description ?? "No topic selected yet",
    })),
  };
}

export async function listResourcesForTeacher(teacherId: string): Promise<ResourceRow[]> {
  const rows = await prisma.resource.findMany({
    where: { teacherId },
    orderBy: { updatedAt: "desc" },
    include: PLANNER_TOPIC_INCLUDE,
  });
  return rows.map(toRow);
}

export async function getResourceForTeacher(id: string, teacherId: string): Promise<ResourceRow | null> {
  const row = await prisma.resource.findFirst({
    where: { id, teacherId },
    include: PLANNER_TOPIC_INCLUDE,
  });
  return row ? toRow(row) : null;
}

export async function createResource(teacherId: string, input: ResourceInput): Promise<string> {
  const created = await prisma.resource.create({
    data: {
      teacherId,
      title: input.title,
      type: input.type,
      url: input.url ?? null,
      description: input.description ?? null,
    },
    select: { id: true },
  });
  return created.id;
}

export async function updateResource(
  id: string,
  teacherId: string,
  input: ResourceInput,
): Promise<boolean> {
  const result = await prisma.resource.updateMany({
    where: { id, teacherId },
    data: {
      title: input.title,
      type: input.type,
      url: input.url ?? null,
      description: input.description ?? null,
    },
  });
  return result.count > 0;
}

export async function deleteResource(id: string, teacherId: string): Promise<boolean> {
  const result = await prisma.resource.deleteMany({ where: { id, teacherId } });
  return result.count > 0;
}

/** Verifies both rows are owned by `teacherId` before writing the association, so a teacher can never link another teacher's planner or resource. */
export async function setResourcePlannerAssociation(
  resourceId: string,
  plannerId: string,
  teacherId: string,
  associated: boolean,
): Promise<boolean> {
  const [resource, planner] = await Promise.all([
    prisma.resource.findFirst({ where: { id: resourceId, teacherId }, select: { id: true } }),
    prisma.lessonPlanner.findFirst({ where: { id: plannerId, teacherId }, select: { id: true } }),
  ]);
  if (!resource || !planner) return false;

  if (associated) {
    await prisma.lessonPlannerResource.upsert({
      where: { plannerId_resourceId: { plannerId, resourceId } },
      create: { plannerId, resourceId },
      update: {},
    });
  } else {
    await prisma.lessonPlannerResource.deleteMany({ where: { plannerId, resourceId } });
  }
  return true;
}

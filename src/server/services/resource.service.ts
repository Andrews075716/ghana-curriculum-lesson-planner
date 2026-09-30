import { NotFoundError, ValidationError } from "@/server/errors/app-error";
import { ResourceInputSchema, ResourceAssociationSchema } from "@/lib/validation/resource.schema";
import {
  createResource,
  deleteResource,
  getResourceForTeacher,
  listResourcesForTeacher,
  setResourcePlannerAssociation,
  updateResource,
  type ResourceRow,
} from "@/server/repositories/resource.repository";

export type { ResourceRow };

export async function getMyResources(teacherId: string): Promise<ResourceRow[]> {
  return listResourcesForTeacher(teacherId);
}

export async function getResourceForTeacherOrThrow(id: string, teacherId: string): Promise<ResourceRow> {
  const row = await getResourceForTeacher(id, teacherId);
  if (!row) throw new NotFoundError("Resource not found.");
  return row;
}

export async function createResourceForTeacher(teacherId: string, rawInput: unknown): Promise<string> {
  const parsed = ResourceInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid resource details.", { cause: parsed.error });
  }
  return createResource(teacherId, { ...parsed.data, url: parsed.data.url || null });
}

export async function updateResourceForTeacher(
  id: string,
  teacherId: string,
  rawInput: unknown,
): Promise<void> {
  const parsed = ResourceInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid resource details.", { cause: parsed.error });
  }
  const updated = await updateResource(id, teacherId, { ...parsed.data, url: parsed.data.url || null });
  if (!updated) throw new NotFoundError("Resource not found.");
}

export async function deleteResourceForTeacher(id: string, teacherId: string): Promise<void> {
  const deleted = await deleteResource(id, teacherId);
  if (!deleted) throw new NotFoundError("Resource not found.");
}

export async function setResourceAssociationForTeacher(
  resourceId: string,
  teacherId: string,
  rawInput: unknown,
): Promise<void> {
  const parsed = ResourceAssociationSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid request.", { cause: parsed.error });
  }
  const ok = await setResourcePlannerAssociation(
    resourceId,
    parsed.data.plannerId,
    teacherId,
    parsed.data.associated,
  );
  if (!ok) throw new NotFoundError("Resource or planner not found.");
}

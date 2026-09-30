import { z } from "zod";

/**
 * Zod schemas for Lesson-scoped content. Only post-lesson reflection is
 * implemented — the file's original scope (LessonPhase/LessonAssessment)
 * is already covered elsewhere (LessonActivity/Assessment in
 * planner.schema.ts).
 *
 * Reflection is filled in by the teacher AFTER teaching, never by AI —
 * every field is optional so a partial save (autosave, same pattern as
 * the planner wizard) is always valid; nothing here is required before
 * "publish" since reflection has nothing to do with the lesson plan being
 * ready to teach.
 */

const reflectionField = z.string().trim().max(4000);

export const ReflectionInputSchema = z
  .object({
    whatWentWell: reflectionField.nullable().optional(),
    subgroupsCatered: reflectionField.nullable().optional(),
    difficulties: reflectionField.nullable().optional(),
    indicatorsAchieved: reflectionField.nullable().optional(),
    reteachingNeeded: reflectionField.nullable().optional(),
    nextLessonChanges: reflectionField.nullable().optional(),
    remarks: reflectionField.nullable().optional(),
  })
  .strict();
export type ReflectionInput = z.infer<typeof ReflectionInputSchema>;

export interface ReflectionData {
  whatWentWell: string | null;
  subgroupsCatered: string | null;
  difficulties: string | null;
  indicatorsAchieved: string | null;
  reteachingNeeded: string | null;
  nextLessonChanges: string | null;
  remarks: string | null;
}

export const EMPTY_REFLECTION: ReflectionData = {
  whatWentWell: null,
  subgroupsCatered: null,
  difficulties: null,
  indicatorsAchieved: null,
  reteachingNeeded: null,
  nextLessonChanges: null,
  remarks: null,
};

/** Whether a reflection actually has any teacher-written content. */
export function hasReflectionContent(reflection: ReflectionData): boolean {
  return Object.values(reflection).some((value) => (value ?? "").trim() !== "");
}

export const ReflectableLessonsQuerySchema = z.object({
  subjectId: z.string().trim().min(1, "subjectId is required"),
  classLevelId: z.string().trim().min(1, "classLevelId is required"),
});

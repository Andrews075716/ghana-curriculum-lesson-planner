import { z } from "zod";

export const ClassInputSchema = z.object({
  name: z.string().trim().min(1, "Class name is required").max(120),
  classLevelId: z.string().trim().min(1, "Form/Level is required"),
  subjectId: z.string().trim().min(1, "Subject is required"),
  academicYear: z.string().trim().min(1, "Academic year is required").max(20),
  notes: z.string().trim().max(2000).optional().nullable(),
});
export type ClassInputData = z.infer<typeof ClassInputSchema>;

export const ClassArchiveSchema = z.object({
  archived: z.boolean(),
});
export type ClassArchiveData = z.infer<typeof ClassArchiveSchema>;

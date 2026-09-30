import { z } from "zod";
import { DokLevelSchema } from "@/lib/validation/planner.schema";

export const AssessmentListQuerySchema = z.object({
  subjectId: z.string().trim().min(1).optional(),
  classLevelId: z.string().trim().min(1).optional(),
  strandId: z.string().trim().min(1).optional(),
  learningIndicatorId: z.string().trim().min(1).optional(),
  dokLevel: DokLevelSchema.optional(),
});
export type AssessmentListQuery = z.infer<typeof AssessmentListQuerySchema>;

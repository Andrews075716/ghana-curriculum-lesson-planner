import { ValidationError } from "@/server/errors/app-error";
import { AssessmentListQuerySchema } from "@/lib/validation/assessment.schema";
import {
  listAssessmentsForTeacher,
  type AssessmentRow,
} from "@/server/repositories/assessment.repository";

export type { AssessmentRow };

export async function getMyAssessments(teacherId: string, rawQuery: unknown): Promise<AssessmentRow[]> {
  const parsed = AssessmentListQuerySchema.safeParse(rawQuery);
  if (!parsed.success) {
    throw new ValidationError("Invalid filter parameters.", { cause: parsed.error });
  }
  return listAssessmentsForTeacher(teacherId, parsed.data);
}

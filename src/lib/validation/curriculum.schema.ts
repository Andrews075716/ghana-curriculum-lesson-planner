import { z } from "zod";

export const ClassLevelsQuerySchema = z.object({
  subjectId: z.string().min(1, "subjectId is required"),
});

export const StrandsQuerySchema = z.object({
  subjectId: z.string().min(1, "subjectId is required"),
  classLevelId: z.string().min(1, "classLevelId is required"),
});

export const SubStrandsQuerySchema = z.object({
  strandId: z.string().min(1, "strandId is required"),
});

export const ContentStandardsQuerySchema = z.object({
  subStrandId: z.string().min(1, "subStrandId is required"),
});

export const LearningOutcomesQuerySchema = z.object({
  contentStandardId: z.string().min(1, "contentStandardId is required"),
});

export const LearningIndicatorsQuerySchema = z.object({
  learningOutcomeId: z.string().min(1, "learningOutcomeId is required"),
});

export const CurriculumSearchQuerySchema = z.object({
  subjectId: z.string().min(1, "subjectId is required"),
  classLevelId: z.string().min(1, "classLevelId is required"),
  q: z.string().trim().min(1, "q is required").max(200),
});

/**
 * A fully-specified path through the curriculum hierarchy. Used both to
 * validate a completed selection (e.g. before creating a planner) and as
 * the shape returned when resolving an existing indicator's ancestor chain
 * for hydrating the selector when editing a planner.
 */
export const CurriculumSelectionSchema = z.object({
  subjectId: z.string().min(1),
  classLevelId: z.string().min(1),
  strandId: z.string().min(1),
  subStrandId: z.string().min(1),
  contentStandardId: z.string().min(1),
  learningOutcomeId: z.string().min(1),
  learningIndicatorId: z.string().min(1),
});

export type CurriculumSelection = z.infer<typeof CurriculumSelectionSchema>;

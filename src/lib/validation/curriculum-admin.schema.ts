import { z } from "zod";

const nonEmptyTrimmed = z.string().trim().min(1);
const optionalCode = z.string().trim().min(1).max(100).optional().nullable();
const sequence = z.number().int().positive();

export const SubjectSchema = z.object({
  code: nonEmptyTrimmed.max(50),
  name: nonEmptyTrimmed.max(200),
});
export type SubjectInput = z.infer<typeof SubjectSchema>;

export const ClassLevelSchema = z.object({
  name: nonEmptyTrimmed.max(100),
  sequence,
});
export type ClassLevelInput = z.infer<typeof ClassLevelSchema>;

export const CurriculumVersionSchema = z.object({
  name: nonEmptyTrimmed.max(200),
  year: z.number().int().min(2000).max(2100).optional().nullable(),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).default("DRAFT"),
});
export type CurriculumVersionInput = z.infer<typeof CurriculumVersionSchema>;

export const StrandSchema = z.object({
  subjectId: nonEmptyTrimmed,
  classLevelId: nonEmptyTrimmed,
  curriculumVersionId: nonEmptyTrimmed,
  name: nonEmptyTrimmed.max(300),
  code: optionalCode,
  sequence,
});
export type StrandInput = z.infer<typeof StrandSchema>;

export const SubStrandSchema = z.object({
  strandId: nonEmptyTrimmed,
  name: nonEmptyTrimmed.max(300),
  code: optionalCode,
  sequence,
});
export type SubStrandInput = z.infer<typeof SubStrandSchema>;

export const ContentStandardSchema = z.object({
  subStrandId: nonEmptyTrimmed,
  code: optionalCode,
  description: nonEmptyTrimmed.max(2000),
  sequence,
});
export type ContentStandardInput = z.infer<typeof ContentStandardSchema>;

export const LearningOutcomeSchema = z.object({
  contentStandardId: nonEmptyTrimmed,
  description: nonEmptyTrimmed.max(2000),
  sequence,
});
export type LearningOutcomeInput = z.infer<typeof LearningOutcomeSchema>;

export const LearningIndicatorSchema = z.object({
  learningOutcomeId: nonEmptyTrimmed,
  code: optionalCode,
  description: nonEmptyTrimmed.max(2000),
  sequence,
});
export type LearningIndicatorInput = z.infer<typeof LearningIndicatorSchema>;

const MAX_IMPORT_CONTENT_LENGTH = 10_000_000; // 10 MB of text — generous for a curriculum file, bounds worst-case memory use while parsing.

export const ImportRequestSchema = z.object({
  format: z.enum(["csv", "json"]),
  content: z
    .string()
    .min(1, "File content is required.")
    .max(MAX_IMPORT_CONTENT_LENGTH, "File is too large (max 10MB)."),
});
export type ImportRequestInput = z.infer<typeof ImportRequestSchema>;

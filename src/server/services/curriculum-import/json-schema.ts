import { z } from "zod";

const trimmedNonEmpty = z.string().trim().min(1);
const sequence = z.number().int().positive();

const learningIndicatorSchema = z.object({
  code: trimmedNonEmpty,
  description: trimmedNonEmpty,
  sequence,
});

const learningOutcomeSchema = z.object({
  description: trimmedNonEmpty,
  sequence,
  indicators: z.array(learningIndicatorSchema).min(1),
});

const contentStandardSchema = z.object({
  code: trimmedNonEmpty,
  description: trimmedNonEmpty,
  sequence,
  outcomes: z.array(learningOutcomeSchema).min(1),
});

const subStrandSchema = z.object({
  code: trimmedNonEmpty,
  name: trimmedNonEmpty,
  sequence,
  contentStandards: z.array(contentStandardSchema).min(1),
});

const strandSchema = z.object({
  code: trimmedNonEmpty,
  name: trimmedNonEmpty,
  sequence,
  subStrands: z.array(subStrandSchema).min(1),
});

export const curriculumTreeSchema = z.object({
  subject: z.object({ code: trimmedNonEmpty, name: trimmedNonEmpty }),
  classLevel: z.object({ name: trimmedNonEmpty, sequence }),
  curriculumVersion: z.object({
    name: trimmedNonEmpty,
    year: z.number().int().optional(),
    status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).optional(),
  }),
  strands: z.array(strandSchema).min(1),
});

/** Accepts either one tree object or an array of trees (multi-subject import in one file). */
export const curriculumTreeFileSchema = z.union([curriculumTreeSchema, z.array(curriculumTreeSchema)]);

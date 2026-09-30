import { z } from "zod";

export const ResourceTypeSchema = z.enum(["LINK", "DOCUMENT", "TEXTBOOK", "VIDEO", "OTHER"]);

export const ResourceInputSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(160),
  type: ResourceTypeSchema,
  url: z
    .union([z.literal(""), z.string().trim().url("Must be a valid URL").max(2000)])
    .optional()
    .nullable(),
  description: z.string().trim().max(2000).optional().nullable(),
});
export type ResourceInputData = z.infer<typeof ResourceInputSchema>;

export const ResourceAssociationSchema = z.object({
  plannerId: z.string().trim().min(1),
  associated: z.boolean(),
});
export type ResourceAssociationData = z.infer<typeof ResourceAssociationSchema>;

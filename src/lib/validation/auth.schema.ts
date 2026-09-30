import { z } from "zod";

const nonEmptyTrimmed = z.string().trim().min(1);

/** Deliberately not `.trim()`ed — leading/trailing spaces in a password are legal (if unusual) and must round-trip exactly. */
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long.")
  .regex(/[a-zA-Z]/, "Password must contain at least one letter.")
  .regex(/[0-9]/, "Password must contain at least one number.")
  .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character.");

export const RegisterSchema = z
  .object({
    name: nonEmptyTrimmed.max(200),
    email: z.email("Enter a valid email address.").trim().toLowerCase(),
    password: passwordSchema,
    confirmPassword: z.string(),
    schoolName: nonEmptyTrimmed.max(200),
    region: z.string().trim().max(100).optional(),
    staffId: z.string().trim().max(100).optional(),
    subjectIds: z.array(nonEmptyTrimmed).max(20).default([]),
    classLevelIds: z.array(nonEmptyTrimmed).max(20).default([]),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });
export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.email("Enter a valid email address.").trim().toLowerCase(),
  password: z.string().min(1, "Password is required."),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const ForgotPasswordSchema = z.object({
  email: z.email("Enter a valid email address.").trim().toLowerCase(),
});
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;

export const ResetPasswordSchema = z
  .object({
    token: nonEmptyTrimmed,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

export const ProfileUpdateSchema = z.object({
  name: nonEmptyTrimmed.max(200),
  schoolName: nonEmptyTrimmed.max(200),
  region: z.string().trim().max(100).optional().nullable(),
  staffId: z.string().trim().max(100).optional().nullable(),
  subjectIds: z.array(nonEmptyTrimmed).max(20).default([]),
  classLevelIds: z.array(nonEmptyTrimmed).max(20).default([]),
});
export type ProfileUpdateInput = z.infer<typeof ProfileUpdateSchema>;

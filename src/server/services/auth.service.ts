import "server-only";
import { randomBytes, createHash } from "node:crypto";
import { ConflictError, NotFoundError, ValidationError } from "@/server/errors/app-error";
import {
  LoginSchema,
  RegisterSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  ProfileUpdateSchema,
} from "@/lib/validation/auth.schema";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { createSession, deleteSession } from "@/server/auth/session";
import { PASSWORD_RESET_TOKEN_DURATION_MS } from "@/server/auth/auth.config";
import { getEmailProvider } from "@/server/email/email-provider.factory";
import {
  createPasswordResetToken,
  createTeacherAccount,
  emailIsRegistered,
  findUserByEmail,
  findValidPasswordResetToken,
  getTeacherProfileDetail,
  markPasswordResetTokenUsed,
  updateTeacherProfile as updateTeacherProfileRepo,
  updateUserPassword,
  type TeacherProfileDetail,
} from "@/server/repositories/auth.repository";
import {
  filterExistingClassLevelIds,
  filterExistingSubjectIds,
} from "@/server/repositories/curriculum.repository";

/**
 * The one place credential logic lives. Every function here either
 * establishes who the caller is (register/login) or acts strictly on the
 * caller's own account (logout/reset/profile) — nothing here ever takes a
 * target user id from the caller.
 */

// --- Registration & login ---------------------------------------------------

export async function registerTeacher(rawData: unknown): Promise<void> {
  const parsed = RegisterSchema.safeParse(rawData);
  if (!parsed.success) {
    throw new ValidationError("Invalid registration details.", { cause: parsed.error });
  }
  const data = parsed.data;

  if (await emailIsRegistered(data.email)) {
    throw new ConflictError("An account with this email already exists.");
  }

  const [validSubjectIds, validClassLevelIds] = await Promise.all([
    filterExistingSubjectIds(data.subjectIds),
    filterExistingClassLevelIds(data.classLevelIds),
  ]);

  const passwordHash = await hashPassword(data.password);
  const { userId } = await createTeacherAccount({
    name: data.name,
    email: data.email,
    passwordHash,
    schoolName: data.schoolName,
    region: data.region?.trim() || null,
    staffId: data.staffId?.trim() || null,
    subjectIds: validSubjectIds,
    classLevelIds: validClassLevelIds,
  });

  await createSession(userId);
}

/** Deliberately the same error for "no such account" and "wrong password" — never confirm which one it was. */
const INVALID_CREDENTIALS_MESSAGE = "Invalid email or password.";

export async function loginUser(rawData: unknown): Promise<void> {
  const parsed = LoginSchema.safeParse(rawData);
  if (!parsed.success) {
    throw new ValidationError("Invalid login details.", { cause: parsed.error });
  }
  const { email, password } = parsed.data;

  const user = await findUserByEmail(email);
  if (!user) {
    // Still hash something, so a non-existent email doesn't respond
    // measurably faster than a wrong password (timing side-channel).
    await verifyPassword(password, "$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidin");
    throw new ValidationError(INVALID_CREDENTIALS_MESSAGE);
  }

  const passwordMatches = await verifyPassword(password, user.passwordHash);
  if (!passwordMatches) {
    throw new ValidationError(INVALID_CREDENTIALS_MESSAGE);
  }

  await createSession(user.id);
}

export async function logoutUser(): Promise<void> {
  await deleteSession();
}

// --- Forgot / reset password -------------------------------------------------

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Always succeeds from the caller's point of view, whether or not the
 * email is registered — the response never reveals which. If it *is*
 * registered, a single-use, 1-hour token is generated and "sent" via the
 * configured EmailProvider (console-logged by default — see
 * server/email).
 */
export async function requestPasswordReset(rawData: unknown, origin: string): Promise<void> {
  const parsed = ForgotPasswordSchema.safeParse(rawData);
  if (!parsed.success) {
    throw new ValidationError("Invalid request.", { cause: parsed.error });
  }

  const user = await findUserByEmail(parsed.data.email);
  if (!user) return;

  const rawToken = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_DURATION_MS);
  await createPasswordResetToken(user.id, hashToken(rawToken), expiresAt);

  const resetUrl = `${origin}/reset-password?token=${rawToken}`;
  const provider = await getEmailProvider();
  await provider.send({
    to: user.email,
    subject: "Reset your Ghana Curriculum Lesson Planner password",
    text: `Hi ${user.name},\n\nUse this link to reset your password (valid for 1 hour):\n${resetUrl}\n\nIf you didn't request this, you can ignore this email.`,
  });
}

export async function resetPassword(rawData: unknown): Promise<void> {
  const parsed = ResetPasswordSchema.safeParse(rawData);
  if (!parsed.success) {
    throw new ValidationError("Invalid request.", { cause: parsed.error });
  }

  const tokenRecord = await findValidPasswordResetToken(hashToken(parsed.data.token));
  if (!tokenRecord) {
    throw new ValidationError("This reset link is invalid or has expired.");
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await updateUserPassword(tokenRecord.userId, passwordHash);
  await markPasswordResetTokenUsed(tokenRecord.id);
}

// --- Teacher profile ---------------------------------------------------------

export async function getTeacherProfileForUser(
  teacherProfileId: string,
): Promise<TeacherProfileDetail> {
  const profile = await getTeacherProfileDetail(teacherProfileId);
  if (!profile) {
    throw new NotFoundError("Teacher profile not found.");
  }
  return profile;
}

export async function updateTeacherProfile(
  teacherProfileId: string,
  userId: string,
  rawData: unknown,
): Promise<void> {
  const parsed = ProfileUpdateSchema.safeParse(rawData);
  if (!parsed.success) {
    throw new ValidationError("Invalid profile details.", { cause: parsed.error });
  }
  const data = parsed.data;

  const [validSubjectIds, validClassLevelIds] = await Promise.all([
    filterExistingSubjectIds(data.subjectIds),
    filterExistingClassLevelIds(data.classLevelIds),
  ]);

  await updateTeacherProfileRepo(teacherProfileId, userId, {
    name: data.name,
    schoolName: data.schoolName,
    region: data.region?.trim() || null,
    staffId: data.staffId?.trim() || null,
    subjectIds: validSubjectIds,
    classLevelIds: validClassLevelIds,
  });
}

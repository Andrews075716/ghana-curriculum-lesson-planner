import { prisma } from "@/server/db/prisma";
import type { Role } from "@prisma/client";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  teacherProfileId: string | null;
}

function toAuthUser(user: {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  teacherProfile: { id: string } | null;
}): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    passwordHash: user.passwordHash,
    role: user.role,
    teacherProfileId: user.teacherProfile?.id ?? null,
  };
}

export async function findUserByEmail(email: string): Promise<AuthUser | null> {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { teacherProfile: { select: { id: true } } },
  });
  return user ? toAuthUser(user) : null;
}

export async function emailIsRegistered(email: string): Promise<boolean> {
  return (await prisma.user.count({ where: { email } })) > 0;
}

export interface CreateTeacherAccountInput {
  name: string;
  email: string;
  passwordHash: string;
  schoolName: string;
  region: string | null;
  staffId: string | null;
  subjectIds: string[];
  classLevelIds: string[];
}

/** Registration: User + TeacherProfile + school find-or-create + subject/class links, one transaction. */
export async function createTeacherAccount(
  input: CreateTeacherAccountInput,
): Promise<{ userId: string; teacherProfileId: string }> {
  return prisma.$transaction(async (tx) => {
    const school =
      (await tx.school.findFirst({ where: { name: input.schoolName } })) ??
      (await tx.school.create({ data: { name: input.schoolName } }));

    const user = await tx.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash: input.passwordHash,
        role: "TEACHER",
      },
    });

    const teacherProfile = await tx.teacherProfile.create({
      data: {
        userId: user.id,
        schoolId: school.id,
        region: input.region,
        staffId: input.staffId,
        subjects: { create: input.subjectIds.map((subjectId) => ({ subjectId })) },
        classLevels: { create: input.classLevelIds.map((classLevelId) => ({ classLevelId })) },
      },
    });

    return { userId: user.id, teacherProfileId: teacherProfile.id };
  });
}

export async function updateUserPassword(userId: string, passwordHash: string): Promise<void> {
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
}

// --- Password reset tokens -------------------------------------------------

export async function createPasswordResetToken(
  userId: string,
  tokenHash: string,
  expiresAt: Date,
): Promise<void> {
  await prisma.passwordResetToken.create({ data: { userId, tokenHash, expiresAt } });
}

export interface ValidResetToken {
  id: string;
  userId: string;
}

/** Returns the token row only if it exists, is unused, and hasn't expired. */
export async function findValidPasswordResetToken(
  tokenHash: string,
): Promise<ValidResetToken | null> {
  const token = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
  if (!token || token.usedAt || token.expiresAt < new Date()) {
    return null;
  }
  return { id: token.id, userId: token.userId };
}

export async function markPasswordResetTokenUsed(tokenId: string): Promise<void> {
  await prisma.passwordResetToken.update({
    where: { id: tokenId },
    data: { usedAt: new Date() },
  });
}

// --- Teacher profile ---------------------------------------------------------

export interface TeacherProfileDetail {
  name: string;
  email: string;
  schoolName: string | null;
  region: string | null;
  staffId: string | null;
  subjectIds: string[];
  classLevelIds: string[];
}

export async function getTeacherProfileDetail(
  teacherProfileId: string,
): Promise<TeacherProfileDetail | null> {
  const profile = await prisma.teacherProfile.findUnique({
    where: { id: teacherProfileId },
    include: {
      user: { select: { name: true, email: true } },
      school: { select: { name: true } },
      subjects: { select: { subjectId: true } },
      classLevels: { select: { classLevelId: true } },
    },
  });
  if (!profile) return null;

  return {
    name: profile.user.name,
    email: profile.user.email,
    schoolName: profile.school?.name ?? null,
    region: profile.region,
    staffId: profile.staffId,
    subjectIds: profile.subjects.map((s) => s.subjectId),
    classLevelIds: profile.classLevels.map((c) => c.classLevelId),
  };
}

export interface UpdateTeacherProfileInput {
  name: string;
  schoolName: string;
  region: string | null;
  staffId: string | null;
  subjectIds: string[];
  classLevelIds: string[];
}

export async function updateTeacherProfile(
  teacherProfileId: string,
  userId: string,
  input: UpdateTeacherProfileInput,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const school =
      (await tx.school.findFirst({ where: { name: input.schoolName } })) ??
      (await tx.school.create({ data: { name: input.schoolName } }));

    await tx.user.update({ where: { id: userId }, data: { name: input.name } });

    await tx.teacherProfile.update({
      where: { id: teacherProfileId },
      data: { schoolId: school.id, region: input.region, staffId: input.staffId },
    });

    await tx.teacherProfileSubject.deleteMany({ where: { teacherProfileId } });
    if (input.subjectIds.length > 0) {
      await tx.teacherProfileSubject.createMany({
        data: input.subjectIds.map((subjectId) => ({ teacherProfileId, subjectId })),
      });
    }

    await tx.teacherProfileClassLevel.deleteMany({ where: { teacherProfileId } });
    if (input.classLevelIds.length > 0) {
      await tx.teacherProfileClassLevel.createMany({
        data: input.classLevelIds.map((classLevelId) => ({ teacherProfileId, classLevelId })),
      });
    }
  });
}

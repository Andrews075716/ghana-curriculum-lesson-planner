import type { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import type { demoTeacher as DemoTeacherData } from "../seed-data/demo-teacher";

/**
 * Idempotent upsert of the single development teacher account, including
 * a real (hashed) password so it can actually log in — see
 * seed-data/demo-teacher.ts for the local-dev-only credentials this uses.
 * Mirrors importCurriculumTree's approach: safe to re-run, matched by
 * stable keys (school name, user email) rather than duplicating rows.
 */
export async function importDemoTeacher(
  prisma: PrismaClient,
  input: typeof DemoTeacherData,
) {
  const school = await prisma.school.findFirst({
    where: { name: input.school.name },
  });
  const schoolRecord = school
    ? school
    : await prisma.school.create({ data: input.school });

  const passwordHash = await bcrypt.hash(input.user.password, 12);

  const user = await prisma.user.upsert({
    where: { email: input.user.email },
    update: { name: input.user.name, passwordHash },
    create: {
      name: input.user.name,
      email: input.user.email,
      passwordHash,
      role: "TEACHER",
    },
  });

  const teacherProfile = await prisma.teacherProfile.upsert({
    where: { userId: user.id },
    update: {
      schoolId: schoolRecord.id,
      staffId: input.teacherProfile.staffId,
      region: input.teacherProfile.region,
    },
    create: {
      userId: user.id,
      schoolId: schoolRecord.id,
      staffId: input.teacherProfile.staffId,
      region: input.teacherProfile.region,
    },
  });

  const subjects = await prisma.subject.findMany({
    where: { code: { in: input.subjectCodes } },
    select: { id: true },
  });
  await prisma.teacherProfileSubject.deleteMany({
    where: { teacherProfileId: teacherProfile.id },
  });
  if (subjects.length > 0) {
    await prisma.teacherProfileSubject.createMany({
      data: subjects.map((s) => ({ teacherProfileId: teacherProfile.id, subjectId: s.id })),
    });
  }

  const classLevels = await prisma.classLevel.findMany({
    where: { name: { in: input.classLevelNames } },
    select: { id: true },
  });
  await prisma.teacherProfileClassLevel.deleteMany({
    where: { teacherProfileId: teacherProfile.id },
  });
  if (classLevels.length > 0) {
    await prisma.teacherProfileClassLevel.createMany({
      data: classLevels.map((c) => ({ teacherProfileId: teacherProfile.id, classLevelId: c.id })),
    });
  }

  return { school: schoolRecord, user, teacherProfile };
}

import type { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import type { demoAdmin as DemoAdminData } from "../seed-data/demo-admin";

/** Idempotent upsert of the single development CURRICULUM_ADMIN account. No TeacherProfile — admins aren't necessarily teachers (the schema makes it optional). */
export async function importDemoAdmin(prisma: PrismaClient, input: typeof DemoAdminData) {
  const passwordHash = await bcrypt.hash(input.password, 12);

  const user = await prisma.user.upsert({
    where: { email: input.email },
    update: { name: input.name, passwordHash, role: "CURRICULUM_ADMIN" },
    create: {
      name: input.name,
      email: input.email,
      passwordHash,
      role: "CURRICULUM_ADMIN",
    },
  });

  return { user };
}

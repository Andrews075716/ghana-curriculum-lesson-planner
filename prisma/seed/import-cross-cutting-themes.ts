import type { PrismaClient } from "@prisma/client";
import type { crossCuttingThemes as CrossCuttingThemesData } from "../seed-data/cross-cutting-themes";

export async function importCrossCuttingThemes(
  prisma: PrismaClient,
  input: typeof CrossCuttingThemesData,
) {
  let count = 0;
  for (const theme of input) {
    await prisma.crossCuttingTheme.upsert({
      where: { name: theme.name },
      update: { description: theme.description },
      create: theme,
    });
    count++;
  }
  return { count };
}

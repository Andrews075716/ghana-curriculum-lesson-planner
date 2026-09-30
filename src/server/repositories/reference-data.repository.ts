import { prisma } from "@/server/db/prisma";

export interface CrossCuttingThemeOption {
  id: string;
  label: string;
  description: string | null;
}

export async function listCrossCuttingThemes(): Promise<CrossCuttingThemeOption[]> {
  const themes = await prisma.crossCuttingTheme.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, description: true },
  });
  return themes.map((theme) => ({
    id: theme.id,
    label: theme.name,
    description: theme.description,
  }));
}

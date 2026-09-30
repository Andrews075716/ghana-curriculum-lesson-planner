import type { PrismaClient } from "@prisma/client";
import { parseImportInput } from "./parse-import-input";
import { validateTrees } from "./validate-tree";
import { diffAgainstDb } from "./diff-against-db";
import { commitCurriculumTree } from "./commit-import";
import type { CurriculumTreeInput, ImportFormat, ImportIssue, ImportPreview } from "./types";

async function buildPreview(
  format: ImportFormat,
  content: string,
): Promise<{ preview: ImportPreview; trees: CurriculumTreeInput[] }> {
  const { trees, issues: parseIssues } = parseImportInput(format, content);
  const structuralIssues = validateTrees(trees);
  const { counts, issues: diffIssues } = await diffAgainstDb(trees);

  const issues: ImportIssue[] = [...parseIssues, ...structuralIssues, ...diffIssues];
  const canCommit = trees.length > 0 && !issues.some((i) => i.severity === "error");

  return { preview: { counts, issues, canCommit }, trees };
}

/** Parses, validates, and diffs against the DB without writing anything. */
export async function previewCurriculumImport(format: ImportFormat, content: string): Promise<ImportPreview> {
  const { preview } = await buildPreview(format, content);
  return preview;
}

/**
 * Re-runs the full parse/validate/diff pipeline (never trusts a
 * client-held preview) and, only if it still comes back clean, commits
 * every tree inside one transaction.
 */
export async function commitCurriculumImportPipeline(
  prisma: PrismaClient,
  format: ImportFormat,
  content: string,
): Promise<ImportPreview> {
  const { preview, trees } = await buildPreview(format, content);
  if (!preview.canCommit) {
    return preview;
  }

  await prisma.$transaction(async (tx) => {
    for (const tree of trees) {
      await commitCurriculumTree(tx, tree);
    }
  });

  return preview;
}

import { ValidationError } from "@/server/errors/app-error";
import { parseCsv } from "./csv-parser";
import { flatRowsToTrees } from "./flat-rows-to-tree";
import { curriculumTreeFileSchema } from "./json-schema";
import type { CurriculumTreeInput, ImportFormat, ImportIssue } from "./types";

/** Parses raw uploaded content into curriculum trees plus any format-level issues found while parsing. */
export function parseImportInput(
  format: ImportFormat,
  content: string,
): { trees: CurriculumTreeInput[]; issues: ImportIssue[] } {
  if (format === "csv") {
    const rows = parseCsv(content);
    if (rows.length === 0) {
      throw new ValidationError("The CSV file has no data rows.");
    }
    return flatRowsToTrees(rows);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new ValidationError("The file is not valid JSON.");
  }

  const result = curriculumTreeFileSchema.safeParse(parsed);
  if (!result.success) {
    const issues: ImportIssue[] = result.error.issues.map((issue) => ({
      severity: "error",
      path: issue.path.join("."),
      message: issue.message,
    }));
    return { trees: [], issues };
  }

  const trees = Array.isArray(result.data) ? result.data : [result.data];
  return { trees, issues: [] };
}

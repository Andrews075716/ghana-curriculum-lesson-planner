import { PrismaClient } from "@prisma/client";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { importExtractionFile, subjectCodeFromSlug } from "../src/server/services/curriculum-import/extraction-importer";
import type { ExtractionCurriculumFile } from "../src/server/services/curriculum-import/extraction-import-types";

/**
 * Checkpoint 6 importer CLI for the Phase-9 curriculum-extraction files.
 *
 * Usage:
 *   npx tsx scripts/import-extracted-curriculum.ts <slug> [<slug> ...]
 *   npx tsx scripts/import-extracted-curriculum.ts --all
 *
 * Each subject is imported inside its own transaction — a failure on one
 * subject is reported and does not affect any other subject already
 * committed or still to come. Individual Learning Outcomes with an
 * unresolved Content-Standard ambiguity are excluded (never written under a
 * guessed or invented Content Standard) and printed clearly for human
 * review; every other, resolvable Learning Outcome in the same subject
 * still imports normally. Re-run this script for the same subject once an
 * excluded Learning Outcome's source JSON is corrected.
 */

const CURRICULUM_DIR = path.join(process.cwd(), "data", "curriculum");
const prisma = new PrismaClient();

function listAllSlugs(): string[] {
  return readdirSync(CURRICULUM_DIR)
    .filter((f) => f.endsWith(".json") && f !== "extraction-progress.json")
    .map((f) => f.replace(/\.json$/, ""))
    .sort();
}

async function importOne(slug: string) {
  const filePath = path.join(CURRICULUM_DIR, `${slug}.json`);
  const file: ExtractionCurriculumFile = JSON.parse(readFileSync(filePath, "utf8"));
  const subjectCode = subjectCodeFromSlug(slug);

  try {
    const result = await prisma.$transaction(
      async (tx) => importExtractionFile(tx, file, subjectCode),
      { timeout: 120_000 },
    );

    if (result.skipped) {
      console.log(`\n[SKIPPED] ${slug} — ${result.skipReason}`);
      return { slug, ok: true, skipped: true };
    }

    console.log(`\n[OK] ${slug} (${result.subjectName})`);
    console.table(result.counts);
    console.log(`  NEEDS_REVIEW nodes flagged: ${result.needsReviewCount}`);
    if (result.codeDisambiguations.length > 0) {
      console.log(`  Code disambiguations (${result.codeDisambiguations.length}):`);
      for (const d of result.codeDisambiguations) console.log(`    - ${d}`);
    }
    if (result.excludedLearningOutcomes.length > 0) {
      console.log(`  EXCLUDED Learning Outcomes (${result.excludedLearningOutcomes.length}) — not written, needs human JSON review:`);
      for (const e of result.excludedLearningOutcomes) {
        console.log(`    - [${e.classLevel}] ${e.subStrand} :: ${e.code ?? "(no code)"} "${e.description.slice(0, 60)}" — ${e.reason}`);
      }
    }
    return { slug, ok: true, skipped: false, result };
  } catch (error) {
    console.error(`\n[FAILED] ${slug}:`, error instanceof Error ? error.message : error);
    return { slug, ok: false, skipped: false };
  }
}

async function main() {
  const args = process.argv.slice(2);
  const slugs = args.includes("--all") || args.length === 0 ? listAllSlugs() : args;

  console.log(`Importing ${slugs.length} subject(s): ${slugs.join(", ")}`);

  const results = [];
  for (const slug of slugs) {
    results.push(await importOne(slug));
  }

  const ok = results.filter((r) => r.ok && !r.skipped).length;
  const skipped = results.filter((r) => r.skipped).length;
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n=== Summary: ${ok} imported, ${skipped} skipped, ${failed} failed (of ${results.length}) ===`);
  if (failed > 0) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

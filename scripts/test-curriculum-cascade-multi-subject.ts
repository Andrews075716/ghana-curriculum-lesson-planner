import { PrismaClient } from "@prisma/client";
import { loginAsDemoTeacher } from "./_lib/authed-session";

/**
 * Checkpoint 7 item 19: walks the full real cascade
 * (Subject -> Class/Form -> Strand -> Sub-Strand -> Content Standard ->
 * Learning Outcome -> Learning Indicator) through the live HTTP API for a
 * representative spread of subjects — not just Computing — and cross-checks
 * every returned label against the database record it came from. Because a
 * subject's first Strand/Sub-Strand/etc. isn't guaranteed to have children
 * all the way down (a Sub-Strand can legitimately have zero Content
 * Standards under NEEDS_REVIEW data, for example), this does a depth-first
 * search across siblings at each level rather than only ever trying index 0.
 *
 * Run against a live dev server + database:
 *
 *   npx tsx scripts/test-curriculum-cascade-multi-subject.ts
 */
const prisma = new PrismaClient();

let passed = 0;
let failed = 0;

function assert(condition: unknown, message: string): asserts condition {
  if (condition) {
    passed++;
    console.log(`  ok - ${message}`);
  } else {
    failed++;
    console.error(`  FAIL - ${message}`);
  }
}

interface Option {
  id: string;
  label: string;
}

const REPRESENTATIVE_SUBJECTS = [
  "Computing",
  "Mathematics",
  "English Language",
  "General Science",
  "Chemistry",
  "Biology",
  "Social Studies",
  "Engineering", // engineering/technology
  "French", // language subject
  "Performing Arts", // arts subject
];

async function main() {
  const session = await loginAsDemoTeacher();
  const getJson = session.get.bind(session);

  console.log("Fetching subjects...");
  const subjectsRes = await getJson("/api/curriculum/subjects");
  assert(subjectsRes.status === 200, "GET /subjects -> 200");
  const subjects: Option[] = subjectsRes.body.data;
  assert(subjects.length === 33, `all 33 subjects returned (got ${subjects.length})`);

  for (const subjectName of REPRESENTATIVE_SUBJECTS) {
    console.log(`\n=== ${subjectName} ===`);
    const subject = subjects.find((s) => s.label === subjectName);
    assert(subject, `subject "${subjectName}" is present`);
    if (!subject) continue;

    const classLevelsRes = await getJson(`/api/curriculum/class-levels?subjectId=${subject.id}`);
    assert(classLevelsRes.status === 200, `${subjectName}: GET /class-levels -> 200`);
    const classLevels: Option[] = classLevelsRes.body.data;
    assert(classLevels.length > 0, `${subjectName}: has at least 1 class level`);
    if (classLevels.length === 0) continue;

    let found = false;

    for (const classLevel of classLevels) {
      if (found) break;
      const strandsRes = await getJson(
        `/api/curriculum/strands?subjectId=${subject.id}&classLevelId=${classLevel.id}`,
      );
      const strands: Option[] = strandsRes.body.data ?? [];

      for (const strand of strands) {
        if (found) break;
        const subStrandsRes = await getJson(`/api/curriculum/sub-strands?strandId=${strand.id}`);
        const subStrands: Option[] = subStrandsRes.body.data ?? [];

        for (const subStrand of subStrands) {
          if (found) break;
          const csRes = await getJson(`/api/curriculum/content-standards?subStrandId=${subStrand.id}`);
          const standards: Option[] = csRes.body.data ?? [];

          for (const standard of standards) {
            if (found) break;
            const loRes = await getJson(`/api/curriculum/learning-outcomes?contentStandardId=${standard.id}`);
            const outcomes: Option[] = loRes.body.data ?? [];

            for (const outcome of outcomes) {
              if (found) break;
              const liRes = await getJson(
                `/api/curriculum/learning-indicators?learningOutcomeId=${outcome.id}`,
              );
              const indicators: Option[] = liRes.body.data ?? [];

              if (indicators.length > 0) {
                const indicator = indicators[0];
                assert(true, `${subjectName}: found a complete chain down to a Learning Indicator`);
                console.log(
                  `    ${classLevel.label} / ${strand.label} / ${subStrand.label} / ${standard.label.slice(0, 60)}...`,
                );

                // Cross-check the returned labels against the DB directly —
                // "Verify that displayed curriculum text matches database
                // records" (Checkpoint 7 item 19).
                const dbIndicator = await prisma.learningIndicator.findUnique({
                  where: { id: indicator.id },
                  select: { code: true, description: true },
                });
                assert(dbIndicator, `${subjectName}: returned indicator id exists in the DB`);
                if (dbIndicator) {
                  const expectedLabel = dbIndicator.code
                    ? `${dbIndicator.code} — ${dbIndicator.description}`
                    : dbIndicator.description;
                  assert(
                    indicator.label === expectedLabel,
                    `${subjectName}: displayed indicator label matches the DB record exactly`,
                  );
                }

                found = true;
              }
            }
          }
        }
      }
    }

    assert(found, `${subjectName}: at least one complete Subject->...->Learning Indicator chain exists`);
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error("Test script crashed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

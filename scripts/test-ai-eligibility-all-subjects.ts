import { PrismaClient } from "@prisma/client";
import { getAiEligibleCurriculumContext } from "@/server/services/curriculum.service";
import { getCurriculumEligibilityChain } from "@/server/repositories/curriculum.repository";
import { isEligibleForAiContext } from "@/server/services/curriculum-eligibility.service";

/**
 * Validates the AI curriculum-eligibility policy (docs/curriculum-status-policy.md)
 * across the ENTIRE imported curriculum, not just a hand-picked fixture:
 *
 *   1) For each of the 33 imported subjects, find at least one Learning
 *      Indicator path and confirm `getAiEligibleCurriculumContext()` — the
 *      one sanctioned AI curriculum-data boundary — returns an AI-usable
 *      context for it. No data is modified either way.
 *   2) A full-hierarchy coverage count: of every Learning Indicator in the
 *      database, how many are teacher-visible, how many are AI-usable, and
 *      a breakdown of exactly why the rest are blocked (rejected vs.
 *      missing provenance/context) — the structural-chain-resolution
 *      bucket is expected to be 0, since every FK in this schema is
 *      required (a Learning Indicator with a broken chain cannot exist).
 *   3) The exact Computing/Form-1 regression fixture from the manual
 *      browser report, reported precisely (see docs/curriculum-status-policy.md
 *      for why this ONE specific fixture remains ineligible under the new
 *      policy, for a different, more honest reason than before).
 *   4) The Agriculture fixture that already succeeded live against a real
 *      Anthropic provider, reconfirmed still eligible.
 *
 * Zero Anthropic calls — this only exercises eligibility/context
 * construction, never an AI provider.
 *
 *   npx tsx scripts/test-ai-eligibility-all-subjects.ts
 */
const prisma = new PrismaClient();

interface SubjectRow {
  subject: string;
  pathFound: boolean;
  extractionStatus: string;
  reviewStatus: string;
  eligible: boolean;
  failureReason: string;
}

async function subjectSmokeTest(): Promise<SubjectRow[]> {
  const subjects = await prisma.subject.findMany({ orderBy: { name: "asc" } });
  const rows: SubjectRow[] = [];

  for (const subject of subjects) {
    const indicators = await prisma.learningIndicator.findMany({
      where: { learningOutcome: { contentStandard: { subStrand: { strand: { subjectId: subject.id } } } } },
      select: { id: true, extractionStatus: true, reviewStatus: true },
      orderBy: { createdAt: "asc" },
    });

    if (indicators.length === 0) {
      rows.push({
        subject: subject.name,
        pathFound: false,
        extractionStatus: "n/a",
        reviewStatus: "n/a",
        eligible: false,
        failureReason: "No Learning Indicator exists for this subject at all.",
      });
      continue;
    }

    let found: SubjectRow | null = null;
    for (const indicator of indicators) {
      const result = await getAiEligibleCurriculumContext(indicator.id);
      if (result.eligible) {
        found = {
          subject: subject.name,
          pathFound: true,
          extractionStatus: indicator.extractionStatus ?? "null",
          reviewStatus: indicator.reviewStatus ?? "null",
          eligible: true,
          failureReason: "",
        };
        break;
      }
    }

    if (found) {
      rows.push(found);
    } else {
      // Exhausted every Learning Indicator in this subject without finding
      // an eligible one — report the LAST attempted one's concrete reason.
      const last = indicators[indicators.length - 1];
      const result = await getAiEligibleCurriculumContext(last.id);
      rows.push({
        subject: subject.name,
        pathFound: true,
        extractionStatus: last.extractionStatus ?? "null",
        reviewStatus: last.reviewStatus ?? "null",
        eligible: false,
        failureReason: !result.eligible ? result.ineligibleReason : "unknown",
      });
    }
  }

  return rows;
}

interface CoverageStats {
  totalLearningIndicators: number;
  teacherVisible: number;
  aiUsable: number;
  blockedRejected: number;
  blockedStructural: number;
  blockedMissingContext: number;
}

async function fullHierarchyCoverage(): Promise<CoverageStats> {
  const ids = await prisma.learningIndicator.findMany({ select: { id: true } });

  let teacherVisible = 0;
  let aiUsable = 0;
  let blockedRejected = 0;
  let blockedStructural = 0;

  for (const { id } of ids) {
    const chain = await getCurriculumEligibilityChain(id);
    if (!chain) {
      blockedStructural++;
      continue;
    }

    const nodes = [
      chain.strand,
      chain.subStrand,
      chain.contentStandard.primary,
      chain.learningOutcome,
      chain.learningIndicator,
    ];
    const anyRejected = nodes.some((n) => n.extractionStatus === "REJECTED" || n.reviewStatus === "REJECTED");
    if (anyRejected) {
      blockedRejected++;
      continue;
    }
    teacherVisible++;

    const eligible = [
      isEligibleForAiContext(chain.strand, { requireProvenance: false }),
      isEligibleForAiContext(chain.subStrand),
      isEligibleForAiContext(chain.contentStandard.primary),
      isEligibleForAiContext(chain.learningOutcome),
      isEligibleForAiContext(chain.learningIndicator),
    ].every(Boolean);
    if (eligible) aiUsable++;
  }

  const totalLearningIndicators = ids.length;
  const blockedMissingContext = teacherVisible - aiUsable;

  return { totalLearningIndicators, teacherVisible, aiUsable, blockedRejected, blockedStructural, blockedMissingContext };
}

async function computingRegressionFixture(): Promise<{ eligible: boolean; reason: string }> {
  const indicator = await prisma.learningIndicator.findFirstOrThrow({
    where: { code: "COMP-F1-STR-01-SS-01-CS-01-LI-01" },
  });
  const result = await getAiEligibleCurriculumContext(indicator.id);
  return result.eligible ? { eligible: true, reason: "" } : { eligible: false, reason: result.ineligibleReason };
}

async function agricultureRegressionFixture(): Promise<{ eligible: boolean; reason: string }> {
  const indicator = await prisma.learningIndicator.findFirstOrThrow({
    where: {
      code: "1.1.2.LI.1",
      learningOutcome: {
        contentStandard: { subStrand: { name: { contains: "EMERGING TECHNOLOGIES IN AGRICULTURE" } } },
      },
    },
  });
  const result = await getAiEligibleCurriculumContext(indicator.id);
  return result.eligible ? { eligible: true, reason: "" } : { eligible: false, reason: result.ineligibleReason };
}

async function main() {
  console.log("1) Per-subject AI-eligibility smoke test (33 subjects)\n");
  const subjectRows = await subjectSmokeTest();
  const passCount = subjectRows.filter((r) => r.eligible).length;
  for (const row of subjectRows) {
    console.log(
      `  ${row.eligible ? "PASS" : "FAIL"} - ${row.subject} | extractionStatus=${row.extractionStatus} ` +
        `reviewStatus=${row.reviewStatus}${row.failureReason ? ` | ${row.failureReason}` : ""}`,
    );
  }
  console.log(`\n  ${passCount}/${subjectRows.length} subjects have at least one AI-usable curriculum path.\n`);

  console.log("2) Full-hierarchy coverage (every Learning Indicator in the database)\n");
  const coverage = await fullHierarchyCoverage();
  console.log(`  Total Learning Indicators:        ${coverage.totalLearningIndicators}`);
  console.log(`  Teacher-visible (not rejected):   ${coverage.teacherVisible}`);
  console.log(`  AI-usable:                        ${coverage.aiUsable}`);
  console.log(`  Blocked — REJECTED:               ${coverage.blockedRejected}`);
  console.log(`  Blocked — structural (broken chain): ${coverage.blockedStructural}`);
  console.log(`  Blocked — missing context/provenance: ${coverage.blockedMissingContext}\n`);

  console.log("3) Computing/Form-1 regression fixture (exact manual-browser-report selection)\n");
  const computing = await computingRegressionFixture();
  console.log(`  eligible=${computing.eligible}${computing.reason ? ` | reason: ${computing.reason}` : ""}\n`);

  console.log("4) Agriculture regression fixture (already succeeded live in the browser)\n");
  const agriculture = await agricultureRegressionFixture();
  console.log(`  eligible=${agriculture.eligible}${agriculture.reason ? ` | reason: ${agriculture.reason}` : ""}\n`);

  if (!agriculture.eligible) {
    console.error("REGRESSION: the Agriculture fixture that previously succeeded live is no longer AI-eligible.");
    process.exitCode = 1;
  }

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error("Test script crashed:", error);
  await prisma.$disconnect();
  process.exitCode = 1;
});

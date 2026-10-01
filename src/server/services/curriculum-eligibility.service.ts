import type { ExtractionStatus, ReviewStatus } from "@prisma/client";

/**
 * Central curriculum-record eligibility policy. Every decision about who
 * can see a curriculum node, or whether it may reach an AI provider as
 * context, lives here and ONLY here — see docs/curriculum-status-policy.md
 * for the full policy writeup and the evidence it's based on. Do not
 * duplicate `extractionStatus`/`reviewStatus` checks in API routes,
 * repositories, or React components; call these functions (or, for a
 * database query, `teacherVisibleStatusWhere()`) instead.
 *
 * `extractionStatus` and `reviewStatus` are independent axes, not one
 * four-value status: `extractionStatus` is set by the machine-assisted
 * extraction/import pipeline and never changes teacher-visible meaning
 * on its own; `reviewStatus` is set only by a human `CURRICULUM_ADMIN` and
 * is `PENDING` for every row today (human review hasn't started). Neither
 * field currently has any `REJECTED` rows in the database, but the checks
 * below are correct if/when that changes.
 */

export interface CurriculumStatusFields {
  extractionStatus: ExtractionStatus | null;
  reviewStatus: ReviewStatus | null;
}

export interface CurriculumProvenanceFields {
  /** Printed source page — the provenance signal this data model actually
   * populates (`sourceDocument` is reserved but currently unpopulated on
   * every row; see docs/curriculum-status-policy.md). */
  sourcePage: number | null;
}

export type CurriculumEligibilityRecord = CurriculumStatusFields & CurriculumProvenanceFields;

function isRejected(fields: CurriculumStatusFields): boolean {
  return fields.extractionStatus === "REJECTED" || fields.reviewStatus === "REJECTED";
}

/** Would a teacher building a planner see this curriculum node at all? */
export function isVisibleToTeacher(fields: CurriculumStatusFields): boolean {
  return !isRejected(fields);
}

/**
 * A `CURRICULUM_ADMIN` always sees every record regardless of status —
 * status is the thing being reviewed, so hiding it from the reviewer would
 * be self-defeating. Kept as an explicit function (rather than "just don't
 * filter") so every visibility decision has one obvious place to look, per
 * the "don't scatter status checks" rule this module exists to satisfy.
 */
export function isVisibleToAdmin(_fields: CurriculumStatusFields): boolean {
  return true;
}

/**
 * May this record be included in curriculum context handed to an AI
 * provider? Fails closed on the two things this data model can actually
 * verify per record: a record is eligible only if it is NOT rejected (by
 * either field), AND — unless `requireProvenance` is explicitly turned off
 * — has a recorded source page. See docs/curriculum-status-policy.md
 * ("Policy revision: human review status is independent of AI usability")
 * for the full reasoning and the product decision behind it.
 *
 * `extractionStatus`/`reviewStatus` being `NEEDS_REVIEW`/`PENDING`, or
 * `extractionStatus` being the legacy `null`, no longer block AI eligibility
 * on their own: human review status tracks curriculum QA (OCR anomalies,
 * code collisions, editorial correctness), not whether the official text
 * itself is safe to hand to an AI provider as context — those are
 * independent axes. A record that genuinely lacks the structural/provenance
 * requirements below stays ineligible, but for that concrete reason, not
 * because review hasn't happened yet.
 *
 * `requireProvenance` defaults to `true`. Pass `false` only for a node type
 * where `sourcePage` is verifiably not part of this data model's real
 * provenance signal for that level — confirmed empirically (not assumed)
 * for `Strand`: `sourcePage` is `null` on 100% of all 352 strand rows, so
 * requiring it there would make every context ineligible. `SubStrand` is
 * 99.5% populated and does NOT get this exemption. See
 * `getAiEligibleCurriculumContext` in curriculum.service.ts for exactly
 * which node types pass `false`.
 */
export function isEligibleForAiContext(
  record: CurriculumEligibilityRecord,
  options?: { requireProvenance?: boolean },
): boolean {
  if (isRejected(record)) return false;
  return options?.requireProvenance === false || record.sourcePage !== null;
}

/**
 * The Prisma `where` fragment equivalent to `isVisibleToTeacher` — spread
 * this into a repository query's `where` so ineligible rows never leave the
 * database, rather than being fetched and filtered in JS (Checkpoint 7's
 * "don't load the whole curriculum into the browser" rule). Null-safe: a
 * bare `{ not: "REJECTED" }` filter would silently exclude rows where the
 * field is `null` (verified against the live database — Prisma's `not`
 * does NOT match `null`), which would wrongly hide the legacy
 * pre-Checkpoint-6 Computing/Form-1 seed rows that predate this status
 * system and have `extractionStatus: null`.
 *
 * Generic so it can be spread into any of the five curriculum-hierarchy
 * models' distinct `WhereInput` types (they all share these two field
 * names) — see `curriculum.repository.ts` for the call sites.
 */
export function teacherVisibleStatusWhere<T>(): T {
  return {
    AND: [
      { OR: [{ extractionStatus: null }, { extractionStatus: { not: "REJECTED" } }] },
      { OR: [{ reviewStatus: null }, { reviewStatus: { not: "REJECTED" } }] },
    ],
  } as T;
}

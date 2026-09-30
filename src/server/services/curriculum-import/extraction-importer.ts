import type { Prisma, ExtractionStatus, ReviewStatus } from "@prisma/client";
import type {
  ExtractionContentStandard,
  ExtractionCurriculumFile,
  ExtractionExcludedLearningOutcome,
  ExtractionImportCounts,
  ExtractionImportResult,
  ExtractionLearningIndicator,
  ExtractionLearningOutcome,
  ExtractionStrand,
  ExtractionSubStrand,
  ImportAction,
} from "./extraction-import-types";

/**
 * Imports one Phase-9 curriculum-extraction JSON file (see
 * `extraction-import-types.ts`) into the database.
 *
 * ## The Content-Standard / Learning-Outcome direction problem
 *
 * The extraction files nest Content Standard *inside* Learning Outcome; the
 * DB schema (and the original architecture doc, and the admin CSV/JSON
 * import feature) has it the other way — Content Standard is the parent.
 * For a subject where every Learning Outcome in the file has exactly one
 * nested Content Standard, the two directions describe the same graph and
 * inverting is a lossless, unambiguous mechanical transform (done below in
 * `groupIntoContentStandards`). For a Learning Outcome with zero or 2+
 * nested Content Standards that isn't the one mechanically-safe shape (see
 * `ResolvedLearningOutcome` doc), the correct grouping cannot be safely
 * reconstructed from this file alone — see the project's Checkpoint 6
 * findings. **This importer excludes that one Learning Outcome** (it is
 * never created, under any content standard, real or invented) rather than
 * guess, while still importing every other Learning Outcome in the same
 * subject/Sub-Strand that IS resolvable — a confirmed genuine per-record
 * gap or ambiguity should not block dozens of unrelated, already-verified
 * records. Every exclusion is reported by name/code/reason in the result
 * (`excludedLearningOutcomes`) so it stays visible for human review; this
 * must not be relaxed into fabricating a relationship without a human,
 * evidence-based decision.
 *
 * ## Idempotency
 *
 * Every node is matched against the DB by a natural key scoped to its
 * parent (code when the source prints one — Strand/Sub-Strand often don't;
 * Content Standard/Learning Outcome/Learning Indicator almost always do —
 * else name/description) before deciding create vs. update, so re-running
 * the same file twice updates rows in place rather than duplicating them.
 * If two different nodes under the same parent legitimately print the same
 * code for different content (confirmed to happen in a few subjects), the
 * second one's *stored* code is disambiguated with a numeric suffix and
 * flagged `NEEDS_REVIEW` — the original printed code is never lost, it's
 * still the description/reviewNote's own text, just not usable alone as
 * this row's unique key.
 *
 * ## Review status
 *
 * `reviewStatus` in the database is ALWAYS written as `PENDING` by this
 * importer, regardless of what the extraction file's own (informal)
 * `reviewStatus` field says — approval is a separate, explicit human action
 * outside this pipeline's scope. `extractionStatus` (EXTRACTED /
 * NEEDS_REVIEW / REJECTED) and `reviewNote` carry the extraction agent's
 * own findings through unchanged.
 */

type TxClient = Prisma.TransactionClient;

function emptyCounts(): ExtractionImportCounts {
  const zero = { created: 0, updated: 0, unchanged: 0 };
  return {
    subjects: { ...zero },
    classLevels: { ...zero },
    curriculumVersions: { ...zero },
    strands: { ...zero },
    subStrands: { ...zero },
    contentStandards: { ...zero },
    learningOutcomes: { ...zero },
    learningIndicators: { ...zero },
    additionalContentStandardLinks: { ...zero },
  };
}

function bump(counts: ExtractionImportCounts, level: keyof ExtractionImportCounts, action: ImportAction) {
  counts[level][action]++;
}

/** Deterministic, stable subject code derived from the source filename's own slug (e.g. "religious-and-moral-education" -> "RELIGIOUS-AND-MORAL-EDUCATION"). */
export function subjectCodeFromSlug(slug: string): string {
  return slug.toUpperCase();
}

/** `classLevel` lives on the Sub-Strand in most files, but on the Strand in a minority (e.g. ict.json) — see extraction-import-types.ts module doc. */
function resolveClassLevel(strand: ExtractionStrand, subStrand: ExtractionSubStrand): string {
  const name = subStrand.classLevel ?? strand.classLevel;
  if (!name) {
    throw new Error(
      `Strand "${strand.name}" / Sub-Strand "${subStrand.name}": no classLevel found on either the Strand or the Sub-Strand.`,
    );
  }
  return name;
}

function classLevelSequence(name: string): number {
  const match = /(\d+)/.exec(name);
  if (!match) throw new Error(`Cannot derive a sequence number from class level name "${name}"`);
  return Number(match[1]);
}

/**
 * The extraction files carry two informal status-ish fields per node —
 * `extractionStatus` (almost always literally "EXTRACTED") and `reviewStatus`
 * (the field that actually carries "NEEDS_REVIEW" in practice, despite the
 * name overlap with this app's own human-approval `ReviewStatus` enum).
 * Either one flagging a problem means this DB row's `extractionStatus`
 * should be NEEDS_REVIEW/REJECTED — the source's own `reviewStatus` value is
 * never written to the DB's `reviewStatus` column, which this importer
 * always sets to PENDING regardless (see module doc).
 */
function mapExtractionStatus(extractionStatus: string | undefined, sourceReviewStatus: string | undefined): ExtractionStatus {
  if (extractionStatus === "REJECTED" || sourceReviewStatus === "REJECTED") return "REJECTED";
  if (extractionStatus === "NEEDS_REVIEW" || sourceReviewStatus === "NEEDS_REVIEW") return "NEEDS_REVIEW";
  return "EXTRACTED";
}

const ALWAYS_PENDING: ReviewStatus = "PENDING";

/**
 * A Learning Outcome with its resolved Content Standard(s), ready for
 * CS-parent-of-LO import. `csList` almost always has exactly one entry
 * (the primary — and only — Content Standard). It can have more than one
 * in the two shapes Checkpoint 6 established as mechanically unambiguous
 * (not guessed), both by the same elimination logic: (a) this Learning
 * Outcome is the *sole* Learning Outcome in its Sub-Strand, so however many
 * Content Standards the source prints for it, there is no sibling any of
 * them could instead belong to; or (b) every *sibling* Learning Outcome in
 * the Sub-Strand already resolves to exactly one Content Standard of its
 * own (Phase 6/continuation JSON corrections got them there), so this
 * Learning Outcome's surplus Content Standards likewise have no viable
 * sibling left to redistribute to — e.g. a stray Content Standard covering
 * a topic (such as vectors) that doesn't map to any printed Learning
 * Outcome's stated topic in the Sub-Strand at all. `csList[0]` becomes the
 * primary `ContentStandard` (its own Learning Indicators become this
 * Learning Outcome's, as always); `csList[1..]` become additional
 * `ContentStandard` rows too (their real Learning Indicators are ALSO
 * attached to this same Learning Outcome, since
 * `LearningIndicator.learningOutcomeId` is the only place they can live per
 * the approved hybrid model — see module doc) plus a
 * `LearningOutcomeContentStandardLink` row recording the extra
 * relationship. Every other 0-or-2+-CS shape remains genuinely ambiguous
 * and is left for a human, evidence-based Phase-1-style correction in the
 * source JSON before it can import at all.
 */
interface ResolvedLearningOutcome {
  lo: ExtractionLearningOutcome;
  csList: ExtractionContentStandard[];
}

/**
 * Re-derives the correct Content-Standard-parent-of-Learning-Outcome
 * grouping for one Sub-Strand. Any Learning Outcome with an unresolvable
 * Content Standard count (see `ResolvedLearningOutcome` doc for the shapes
 * that ARE mechanically safe to resolve) is reported in `excluded` instead
 * of being imported under a guessed or invented Content Standard.
 */
function groupIntoContentStandards(
  strandName: string,
  classLevel: string,
  subStrand: ExtractionSubStrand,
): { resolved: ResolvedLearningOutcome[]; excluded: ExtractionExcludedLearningOutcome[] } {
  const los = subStrand.learningOutcomes;
  const resolved: ResolvedLearningOutcome[] = [];
  const excluded: ExtractionExcludedLearningOutcome[] = [];
  for (const lo of los) {
    const cs = lo.contentStandards ?? [];
    const siblings = los.filter((l) => l !== lo);
    const allSiblingsResolvedToOne = siblings.length > 0 && siblings.every((sib) => (sib.contentStandards ?? []).length === 1);
    if (cs.length === 1) {
      resolved.push({ lo, csList: cs });
    } else if (cs.length > 1 && (los.length === 1 || allSiblingsResolvedToOne)) {
      // Sole Learning Outcome in this Sub-Strand, OR every sibling Learning
      // Outcome already has exactly one Content Standard of its own — by
      // elimination, none of THIS Learning Outcome's 2+ Content Standards
      // could belong to a sibling instead, so they must all be its own
      // (primary + additional). Same "no viable alternative parent" logic
      // as the sole-LO case, generalized from "only LO in the Sub-Strand"
      // to "only LO with a Content Standard surplus given fully-resolved siblings".
      resolved.push({ lo, csList: cs });
    } else {
      const reason =
        cs.length === 0
          ? `no Content Standard is nested under this Learning Outcome in the source (expected exactly 1, or 2+ only if it were the Sub-Strand's sole Learning Outcome or every sibling already resolves to exactly 1, which is not the case here — ${los.length} siblings exist)`
          : `${cs.length} Content Standards are nested under this Learning Outcome, but it is neither the Sub-Strand's sole Learning Outcome nor are all ${los.length - 1} siblings already resolved to exactly 1 Content Standard each, so which sibling(s) these really belong to cannot be re-derived automatically`;
      excluded.push({
        code: lo.code ?? null,
        description: lo.description,
        subStrand: `${strandName} / ${subStrand.name}`,
        classLevel,
        reason,
      });
    }
  }
  return { resolved, excluded };
}

/**
 * Matches by `name` first, not `code`: the display name comes from the
 * curriculum document itself (the real-world identity), while `code` here
 * is an arbitrary identifier this importer generates from the source
 * filename — a pre-existing Subject row (e.g. the demo seed's "Computing",
 * code "COMP") can easily already exist under a different code for the
 * same real subject this file also describes ("Computing", code would-be
 * "COMPUTING"). Reuse the existing row as-is (never overwrite its code)
 * rather than colliding on the name's own unique constraint.
 */
async function upsertSubject(tx: TxClient, code: string, name: string, counts: ExtractionImportCounts) {
  const existingByName = await tx.subject.findUnique({ where: { name } });
  if (existingByName) {
    bump(counts, "subjects", "unchanged");
    return existingByName;
  }
  const existingByCode = await tx.subject.findUnique({ where: { code } });
  if (existingByCode) {
    const updated = await tx.subject.update({ where: { id: existingByCode.id }, data: { name } });
    bump(counts, "subjects", "updated");
    return updated;
  }
  const created = await tx.subject.create({ data: { code, name } });
  bump(counts, "subjects", "created");
  return created;
}

async function upsertClassLevel(tx: TxClient, name: string, counts: ExtractionImportCounts) {
  const sequence = classLevelSequence(name);
  const existing = await tx.classLevel.findUnique({ where: { name } });
  if (!existing) {
    const created = await tx.classLevel.create({ data: { name, sequence } });
    bump(counts, "classLevels", "created");
    return created;
  }
  if (existing.sequence !== sequence) {
    const updated = await tx.classLevel.update({ where: { id: existing.id }, data: { sequence } });
    bump(counts, "classLevels", "updated");
    return updated;
  }
  bump(counts, "classLevels", "unchanged");
  return existing;
}

async function upsertCurriculumVersion(
  tx: TxClient,
  input: ExtractionCurriculumFile["curriculumVersion"],
  counts: ExtractionImportCounts,
) {
  const existing = await tx.curriculumVersion.findUnique({ where: { name: input.name } });
  const data = { year: input.year ?? null, issuingAuthority: input.issuingAuthority ?? null };
  if (!existing) {
    const created = await tx.curriculumVersion.create({ data: { name: input.name, ...data } });
    bump(counts, "curriculumVersions", "created");
    return created;
  }
  const changed = existing.year !== data.year || existing.issuingAuthority !== data.issuingAuthority;
  if (changed) {
    const updated = await tx.curriculumVersion.update({ where: { id: existing.id }, data });
    bump(counts, "curriculumVersions", "updated");
    return updated;
  }
  bump(counts, "curriculumVersions", "unchanged");
  return existing;
}

async function upsertStrand(
  tx: TxClient,
  params: {
    subjectId: string;
    classLevelId: string;
    curriculumVersionId: string;
    name: string;
    code: string | null;
    pathway: string | null;
    sequence: number;
  },
  counts: ExtractionImportCounts,
) {
  const existing = await tx.strand.findFirst({
    where: {
      subjectId: params.subjectId,
      classLevelId: params.classLevelId,
      curriculumVersionId: params.curriculumVersionId,
      pathway: params.pathway,
      name: params.name,
    },
  });
  if (!existing) {
    const created = await tx.strand.create({
      data: {
        subjectId: params.subjectId,
        classLevelId: params.classLevelId,
        curriculumVersionId: params.curriculumVersionId,
        name: params.name,
        code: params.code,
        pathway: params.pathway,
        sequence: params.sequence,
        extractionStatus: "EXTRACTED",
        reviewStatus: ALWAYS_PENDING,
      },
    });
    bump(counts, "strands", "created");
    return created;
  }
  const changed = existing.code !== params.code || existing.sequence !== params.sequence;
  if (changed) {
    const updated = await tx.strand.update({
      where: { id: existing.id },
      data: { code: params.code, sequence: params.sequence },
    });
    bump(counts, "strands", "updated");
    return updated;
  }
  bump(counts, "strands", "unchanged");
  return existing;
}

async function upsertSubStrand(
  tx: TxClient,
  strandId: string,
  input: ExtractionSubStrand,
  counts: ExtractionImportCounts,
) {
  const extractionStatus = mapExtractionStatus(input.extractionStatus, input.reviewStatus);
  const reviewNote = input.reviewNote ?? null;
  const tlr = input.teachingLearningResources ?? [];

  const existing = await tx.subStrand.findFirst({ where: { strandId, name: input.name } });
  if (!existing) {
    const created = await tx.subStrand.create({
      data: {
        strandId,
        name: input.name,
        code: input.code ?? null,
        sequence: input.sequence,
        teachingLearningResources: tlr,
        sourceDocument: undefined,
        sourcePage: input.source?.page ?? null,
        sourcePdfPageIndex: input.source?.pdfPageIndex ?? null,
        extractionStatus,
        reviewStatus: ALWAYS_PENDING,
        reviewNote,
      },
    });
    bump(counts, "subStrands", "created");
    return created;
  }
  const changed =
    existing.code !== (input.code ?? null) ||
    existing.sequence !== input.sequence ||
    JSON.stringify(existing.teachingLearningResources) !== JSON.stringify(tlr) ||
    existing.extractionStatus !== extractionStatus ||
    existing.reviewNote !== reviewNote;
  if (changed) {
    const updated = await tx.subStrand.update({
      where: { id: existing.id },
      data: {
        code: input.code ?? null,
        sequence: input.sequence,
        teachingLearningResources: tlr,
        sourcePage: input.source?.page ?? null,
        sourcePdfPageIndex: input.source?.pdfPageIndex ?? null,
        extractionStatus,
        reviewNote,
      },
    });
    bump(counts, "subStrands", "updated");
    return updated;
  }
  bump(counts, "subStrands", "unchanged");
  return existing;
}

/** Finds an existing row by (parentId, code) when code is present; disambiguates a genuine content collision by appending a numeric suffix to the code actually stored. Returns the code to store (possibly suffixed) and any disambiguation note. */
async function resolveCode<T extends { id: string; code: string | null; description: string }>(
  findByCode: (code: string) => Promise<T | null>,
  rawCode: string | null,
  description: string,
): Promise<{ code: string | null; existing: T | null; disambiguationNote: string | null }> {
  if (!rawCode) return { code: null, existing: null, disambiguationNote: null };

  let candidate = rawCode;
  let suffix = 2;
  for (;;) {
    const existing = await findByCode(candidate);
    if (!existing) return { code: candidate, existing: null, disambiguationNote: candidate !== rawCode ? `Stored as "${candidate}" — printed code "${rawCode}" collides with a different node under the same parent.` : null };
    if (existing.description === description) {
      return { code: candidate, existing, disambiguationNote: candidate !== rawCode ? `Stored as "${candidate}" — printed code "${rawCode}" collides with a different node under the same parent.` : null };
    }
    candidate = `${rawCode}-DUP${suffix}`;
    suffix++;
  }
}

async function upsertContentStandard(
  tx: TxClient,
  subStrandId: string,
  input: ExtractionContentStandard,
  sequence: number,
  counts: ExtractionImportCounts,
  disambiguations: string[],
) {
  const extractionStatus = mapExtractionStatus(input.extractionStatus, input.reviewStatus);
  const reviewNote = input.reviewNote ?? null;
  const tlr = input.teachingLearningResources ?? [];

  const { code, existing, disambiguationNote } = await resolveCode(
    (c) => tx.contentStandard.findFirst({ where: { subStrandId, code: c } }),
    input.code ?? null,
    input.description,
  );
  if (disambiguationNote) disambiguations.push(`Content Standard: ${disambiguationNote}`);

  if (!existing) {
    const created = await tx.contentStandard.create({
      data: {
        subStrandId,
        code,
        description: input.description,
        sequence,
        teachingLearningResources: tlr,
        sourcePage: input.source?.page ?? null,
        sourcePdfPageIndex: input.source?.pdfPageIndex ?? null,
        extractionStatus,
        reviewStatus: ALWAYS_PENDING,
        reviewNote,
      },
    });
    bump(counts, "contentStandards", "created");
    return created;
  }
  const changed =
    existing.sequence !== sequence ||
    JSON.stringify(existing.teachingLearningResources) !== JSON.stringify(tlr) ||
    existing.extractionStatus !== extractionStatus ||
    existing.reviewNote !== reviewNote;
  if (changed) {
    const updated = await tx.contentStandard.update({
      where: { id: existing.id },
      data: {
        sequence,
        teachingLearningResources: tlr,
        sourcePage: input.source?.page ?? null,
        sourcePdfPageIndex: input.source?.pdfPageIndex ?? null,
        extractionStatus,
        reviewNote,
      },
    });
    bump(counts, "contentStandards", "updated");
    return updated;
  }
  bump(counts, "contentStandards", "unchanged");
  return existing;
}

async function upsertLearningOutcome(
  tx: TxClient,
  contentStandardId: string,
  input: ExtractionLearningOutcome,
  counts: ExtractionImportCounts,
  disambiguations: string[],
) {
  const extractionStatus = mapExtractionStatus(input.extractionStatus, input.reviewStatus);
  const reviewNote = input.reviewNote ?? null;

  const { code, existing, disambiguationNote } = await resolveCode(
    (c) => tx.learningOutcome.findFirst({ where: { contentStandardId, code: c } }),
    input.code ?? null,
    input.description,
  );
  if (disambiguationNote) disambiguations.push(`Learning Outcome: ${disambiguationNote}`);

  let outcome;
  if (!existing) {
    outcome = await tx.learningOutcome.create({
      data: {
        contentStandardId,
        code,
        description: input.description,
        sequence: input.sequence,
        sourcePage: input.source?.page ?? null,
        sourcePdfPageIndex: input.source?.pdfPageIndex ?? null,
        extractionStatus,
        reviewStatus: ALWAYS_PENDING,
        reviewNote,
      },
    });
    bump(counts, "learningOutcomes", "created");
  } else {
    const changed =
      existing.sequence !== input.sequence ||
      existing.extractionStatus !== extractionStatus ||
      existing.reviewNote !== reviewNote;
    if (changed) {
      outcome = await tx.learningOutcome.update({
        where: { id: existing.id },
        data: {
          sequence: input.sequence,
          sourcePage: input.source?.page ?? null,
          sourcePdfPageIndex: input.source?.pdfPageIndex ?? null,
          extractionStatus,
          reviewNote,
        },
      });
      bump(counts, "learningOutcomes", "updated");
    } else {
      outcome = existing;
      bump(counts, "learningOutcomes", "unchanged");
    }
  }

  const g = input.guidance;
  if (g && (g.twentyFirstCenturySkills || g.gesi || g.sel || (g.nationalCoreValues?.length ?? 0) > 0)) {
    await tx.learningOutcomeGuidance.upsert({
      where: { learningOutcomeId: outcome.id },
      update: {
        twentyFirstCenturySkills: g.twentyFirstCenturySkills ?? null,
        gesi: g.gesi ?? null,
        sel: g.sel ?? null,
        nationalCoreValues: g.nationalCoreValues ?? [],
      },
      create: {
        learningOutcomeId: outcome.id,
        twentyFirstCenturySkills: g.twentyFirstCenturySkills ?? null,
        gesi: g.gesi ?? null,
        sel: g.sel ?? null,
        nationalCoreValues: g.nationalCoreValues ?? [],
      },
    });
  }

  return outcome;
}

async function upsertLearningIndicator(
  tx: TxClient,
  learningOutcomeId: string,
  input: ExtractionLearningIndicator,
  counts: ExtractionImportCounts,
  disambiguations: string[],
) {
  const extractionStatus = mapExtractionStatus(input.extractionStatus, input.reviewStatus);
  const reviewNote = input.reviewNote ?? null;

  const { code, existing, disambiguationNote } = await resolveCode(
    (c) => tx.learningIndicator.findFirst({ where: { learningOutcomeId, code: c } }),
    input.code ?? null,
    input.description,
  );
  if (disambiguationNote) disambiguations.push(`Learning Indicator: ${disambiguationNote}`);

  let indicator;
  if (!existing) {
    indicator = await tx.learningIndicator.create({
      data: {
        learningOutcomeId,
        code,
        description: input.description,
        sequence: input.sequence,
        sourcePage: input.source?.page ?? null,
        sourcePdfPageIndex: input.source?.pdfPageIndex ?? null,
        extractionStatus,
        reviewStatus: ALWAYS_PENDING,
        reviewNote,
      },
    });
    bump(counts, "learningIndicators", "created");
  } else {
    const changed =
      existing.sequence !== input.sequence ||
      existing.extractionStatus !== extractionStatus ||
      existing.reviewNote !== reviewNote;
    if (changed) {
      indicator = await tx.learningIndicator.update({
        where: { id: existing.id },
        data: {
          sequence: input.sequence,
          sourcePage: input.source?.page ?? null,
          sourcePdfPageIndex: input.source?.pdfPageIndex ?? null,
          extractionStatus,
          reviewNote,
        },
      });
      bump(counts, "learningIndicators", "updated");
    } else {
      indicator = existing;
      bump(counts, "learningIndicators", "unchanged");
    }
  }

  const exemplars = input.pedagogicalExemplars ?? [];
  const a = input.assessment;
  if (exemplars.length > 0 || a) {
    await tx.learningIndicatorGuidance.upsert({
      where: { learningIndicatorId: indicator.id },
      update: {
        pedagogicalExemplars: exemplars,
        assessmentCode: a?.code ?? null,
        dokLevels: a?.dokLevels ?? [],
        dokDescriptions: a?.dokDescriptions ?? [],
      },
      create: {
        learningIndicatorId: indicator.id,
        pedagogicalExemplars: exemplars,
        assessmentCode: a?.code ?? null,
        dokLevels: a?.dokLevels ?? [],
        dokDescriptions: a?.dokDescriptions ?? [],
      },
    });
  }

  return indicator;
}

/**
 * Records an ADDITIONAL (non-primary) Content-Standard/Learning-Outcome
 * relationship — see `ResolvedLearningOutcome` doc. Idempotent via the
 * schema's own `@@unique([learningOutcomeId, contentStandardId])`.
 */
async function upsertLearningOutcomeContentStandardLink(
  tx: TxClient,
  learningOutcomeId: string,
  contentStandardId: string,
  note: string,
  counts: ExtractionImportCounts,
) {
  const existing = await tx.learningOutcomeContentStandardLink.findUnique({
    where: { learningOutcomeId_contentStandardId: { learningOutcomeId, contentStandardId } },
  });
  if (existing) {
    if (existing.note !== note) {
      await tx.learningOutcomeContentStandardLink.update({ where: { id: existing.id }, data: { note } });
      bump(counts, "additionalContentStandardLinks", "updated");
    } else {
      bump(counts, "additionalContentStandardLinks", "unchanged");
    }
    return;
  }
  await tx.learningOutcomeContentStandardLink.create({ data: { learningOutcomeId, contentStandardId, note } });
  bump(counts, "additionalContentStandardLinks", "created");
}

/**
 * Imports one subject file. Must be called inside `prisma.$transaction`.
 * Every Learning Outcome that resolves safely (see `ResolvedLearningOutcome`
 * doc) is imported; any that doesn't is excluded (never created under a
 * guessed or invented Content Standard) and reported in
 * `result.excludedLearningOutcomes` for human review. `skipped: true` is
 * reserved for a file-level failure (e.g. no Strands at all) — a subject
 * with some excluded Learning Outcomes still imports everything else.
 */
export async function importExtractionFile(
  tx: TxClient,
  file: ExtractionCurriculumFile,
  subjectCode: string,
): Promise<ExtractionImportResult> {
  const counts = emptyCounts();
  const disambiguations: string[] = [];
  const excludedLearningOutcomes: ExtractionExcludedLearningOutcome[] = [];
  let needsReviewCount = 0;

  const subject = await upsertSubject(tx, subjectCode, file.subject.name, counts);
  const curriculumVersion = await upsertCurriculumVersion(tx, file.curriculumVersion, counts);

  const classLevelCache = new Map<string, { id: string }>();
  async function getClassLevel(name: string) {
    const cached = classLevelCache.get(name);
    if (cached) return cached;
    const cl = await upsertClassLevel(tx, name, counts);
    classLevelCache.set(name, cl);
    return cl;
  }

  for (const strandInput of file.strands) {
    // Group this Strand's Sub-Strands by class level (a Strand object here
    // may span more than one year — see module doc).
    const byClassLevel = new Map<string, ExtractionSubStrand[]>();
    for (const subStrand of strandInput.subStrands) {
      const key = resolveClassLevel(strandInput, subStrand);
      if (!byClassLevel.has(key)) byClassLevel.set(key, []);
      byClassLevel.get(key)!.push(subStrand);
    }

    for (const [classLevelName, subStrands] of byClassLevel) {
      const classLevel = await getClassLevel(classLevelName);
      const strand = await upsertStrand(
        tx,
        {
          subjectId: subject.id,
          classLevelId: classLevel.id,
          curriculumVersionId: curriculumVersion.id,
          name: strandInput.name,
          code: strandInput.code ?? null,
          pathway: strandInput.pathway ?? null,
          sequence: strandInput.sequence,
        },
        counts,
      );

      for (const subStrandInput of subStrands) {
        const subStrand = await upsertSubStrand(tx, strand.id, subStrandInput, counts);

        const { resolved, excluded } = groupIntoContentStandards(strandInput.name, classLevelName, subStrandInput);
        excludedLearningOutcomes.push(...excluded);

        let csSequence = 1;
        for (const { lo, csList } of resolved) {
          const [primaryCs, ...additionalCsList] = csList;

          const primaryContentStandard = await upsertContentStandard(
            tx,
            subStrand.id,
            primaryCs,
            csSequence++,
            counts,
            disambiguations,
          );
          const learningOutcome = await upsertLearningOutcome(
            tx,
            primaryContentStandard.id,
            lo,
            counts,
            disambiguations,
          );

          let liSequenceOffset = 0;
          for (const li of primaryCs.learningIndicators) {
            await upsertLearningIndicator(tx, learningOutcome.id, li, counts, disambiguations);
            if (li.extractionStatus === "NEEDS_REVIEW" || li.reviewNote) needsReviewCount++;
          }
          liSequenceOffset += primaryCs.learningIndicators.length;
          if (primaryCs.extractionStatus === "NEEDS_REVIEW" || primaryCs.reviewNote) needsReviewCount++;
          if (lo.extractionStatus === "NEEDS_REVIEW" || lo.reviewNote) needsReviewCount++;

          // Additional Content Standards (only reachable when this LO is the sole
          // Learning Outcome in its Sub-Strand — see ResolvedLearningOutcome doc).
          // Each becomes its own real ContentStandard row (own code/description
          // preserved), linked to this same Learning Outcome via the junction
          // table; its real Learning Indicators are ALSO attached to this same
          // Learning Outcome (LearningIndicator has no direct link to
          // ContentStandard in the approved hybrid model), sequence continuing
          // on from the primary's so ordering in any UI stays sensible.
          for (const additionalCs of additionalCsList) {
            const additionalContentStandard = await upsertContentStandard(
              tx,
              subStrand.id,
              additionalCs,
              csSequence++,
              counts,
              disambiguations,
            );
            await upsertLearningOutcomeContentStandardLink(
              tx,
              learningOutcome.id,
              additionalContentStandard.id,
              `Additional Content Standard for Learning Outcome ${lo.code ?? lo.description.slice(0, 40)}: this Learning Outcome is either the Sub-Strand's sole Learning Outcome, or every sibling Learning Outcome already resolves to its own single Content Standard, so Content Standard ${additionalCs.code ?? "(no code)"} has no viable sibling to belong to instead — recorded as an additional (non-primary) relationship rather than forced into the single required primary slot already held by ${primaryCs.code ?? "(no code)"}.`,
              counts,
            );
            for (const li of additionalCs.learningIndicators) {
              await upsertLearningIndicator(
                tx,
                learningOutcome.id,
                { ...li, sequence: li.sequence + liSequenceOffset },
                counts,
                disambiguations,
              );
              if (li.extractionStatus === "NEEDS_REVIEW" || li.reviewNote) needsReviewCount++;
            }
            liSequenceOffset += additionalCs.learningIndicators.length;
            if (additionalCs.extractionStatus === "NEEDS_REVIEW" || additionalCs.reviewNote) needsReviewCount++;
          }
        }
        if (subStrandInput.extractionStatus === "NEEDS_REVIEW" || subStrandInput.reviewNote) needsReviewCount++;
      }
    }
  }

  return {
    subjectName: file.subject.name,
    counts,
    needsReviewCount,
    codeDisambiguations: disambiguations,
    excludedLearningOutcomes,
    skipped: false,
  };
}

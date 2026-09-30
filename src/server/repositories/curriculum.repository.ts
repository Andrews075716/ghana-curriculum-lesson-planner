import { prisma } from "@/server/db/prisma";

/** Generic shape consumed by the curriculum selector for every level. */
export interface CurriculumOption {
  id: string;
  label: string;
}

export interface LearningIndicatorPath {
  subjectId: string;
  classLevelId: string;
  strandId: string;
  subStrandId: string;
  contentStandardId: string;
  learningOutcomeId: string;
  learningIndicatorId: string;
}

/**
 * The human-readable curriculum chain for one learning indicator — text,
 * not ids. This is the shape handed to AI providers as read-only context
 * (see server/ai): AI reads curriculum text, it never writes curriculum
 * ids, and none of these fields are ever sourced from anywhere but this
 * query.
 */
export interface LearningIndicatorTextPath {
  subject: string;
  classLevel: string;
  strand: string;
  subStrand: string;
  contentStandard: string;
  learningOutcome: string;
  learningIndicator: string;
}

// --- Reads -----------------------------------------------------------

export async function listSubjects(): Promise<CurriculumOption[]> {
  const rows = await prisma.subject.findMany({
    where: { strands: { some: {} } },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  return rows.map((r) => ({ id: r.id, label: r.name }));
}

export async function listClassLevels(subjectId: string): Promise<CurriculumOption[]> {
  const rows = await prisma.classLevel.findMany({
    where: { strands: { some: { subjectId } } },
    orderBy: { sequence: "asc" },
    select: { id: true, name: true },
  });
  return rows.map((r) => ({ id: r.id, label: r.name }));
}

/** Every class level, unfiltered by subject — for contexts like a teacher profile that aren't building a curriculum-alignment cascade. */
export async function listAllClassLevels(): Promise<CurriculumOption[]> {
  const rows = await prisma.classLevel.findMany({
    orderBy: { sequence: "asc" },
    select: { id: true, name: true },
  });
  return rows.map((r) => ({ id: r.id, label: r.name }));
}

export async function listStrands(
  subjectId: string,
  classLevelId: string,
): Promise<CurriculumOption[]> {
  const rows = await prisma.strand.findMany({
    where: { subjectId, classLevelId },
    orderBy: { sequence: "asc" },
    select: { id: true, name: true },
  });
  return rows.map((r) => ({ id: r.id, label: r.name }));
}

export async function listSubStrands(strandId: string): Promise<CurriculumOption[]> {
  const rows = await prisma.subStrand.findMany({
    where: { strandId },
    orderBy: { sequence: "asc" },
    select: { id: true, name: true },
  });
  return rows.map((r) => ({ id: r.id, label: r.name }));
}

/** Prefixes the official code onto the wording when a code is present — never paraphrases the wording itself. */
function withCode(code: string | null, description: string): string {
  return code ? `${code} — ${description}` : description;
}

export async function listContentStandards(
  subStrandId: string,
): Promise<CurriculumOption[]> {
  const rows = await prisma.contentStandard.findMany({
    where: { subStrandId },
    orderBy: { sequence: "asc" },
    select: { id: true, code: true, description: true },
  });
  return rows.map((r) => ({ id: r.id, label: withCode(r.code, r.description) }));
}

/**
 * Learning Outcomes for a Content Standard — the UNION of:
 *  A. Learning Outcomes where this Content Standard is the PRIMARY parent
 *     (`LearningOutcome.contentStandardId`), and
 *  B. Learning Outcomes ADDITIONALLY linked to this Content Standard via
 *     `LearningOutcomeContentStandardLink` (see docs/curriculum-relationship-analysis.md).
 * A single `findMany` with an `OR` across both relations returns each
 * matching Learning Outcome exactly once (Prisma's relational `some` filter
 * doesn't fan out the top-level rows), so no manual de-duplication is
 * needed. Ordered by `sequence` then `id` for a fully deterministic result
 * even though the two source relations don't share one sequence space.
 */
export async function listLearningOutcomes(
  contentStandardId: string,
): Promise<CurriculumOption[]> {
  const rows = await prisma.learningOutcome.findMany({
    where: {
      OR: [
        { contentStandardId },
        { additionalContentStandardLinks: { some: { contentStandardId } } },
      ],
    },
    orderBy: [{ sequence: "asc" }, { id: "asc" }],
    select: { id: true, code: true, description: true },
  });
  return rows.map((r) => ({ id: r.id, label: withCode(r.code, r.description) }));
}

export async function listLearningIndicators(
  learningOutcomeId: string,
): Promise<CurriculumOption[]> {
  const rows = await prisma.learningIndicator.findMany({
    where: { learningOutcomeId },
    orderBy: { sequence: "asc" },
    select: { id: true, code: true, description: true },
  });
  return rows.map((r) => ({ id: r.id, label: withCode(r.code, r.description) }));
}

export interface CurriculumSearchResult {
  strandId: string;
  strandName: string;
  subStrandId: string;
  subStrandName: string;
  contentStandardId: string;
  contentStandardLabel: string;
  learningOutcomeId: string;
  learningOutcomeLabel: string;
  learningIndicatorId: string;
  learningIndicatorLabel: string;
}

/**
 * Text search across a single subject+classLevel's curriculum tree (strand
 * name down to learning indicator description) — for the teacher-facing
 * Curriculum browser's search box. Deliberately scoped to one subject/form
 * at a time, same as every other curriculum read query, rather than a
 * global cross-subject search.
 */
export async function searchLearningIndicators(
  subjectId: string,
  classLevelId: string,
  query: string,
): Promise<CurriculumSearchResult[]> {
  const rows = await prisma.learningIndicator.findMany({
    where: {
      learningOutcome: {
        contentStandard: { subStrand: { strand: { subjectId, classLevelId } } },
      },
      OR: [
        { description: { contains: query, mode: "insensitive" } },
        { learningOutcome: { description: { contains: query, mode: "insensitive" } } },
        {
          learningOutcome: {
            contentStandard: { description: { contains: query, mode: "insensitive" } },
          },
        },
        {
          learningOutcome: {
            contentStandard: { subStrand: { name: { contains: query, mode: "insensitive" } } },
          },
        },
        {
          learningOutcome: {
            contentStandard: {
              subStrand: { strand: { name: { contains: query, mode: "insensitive" } } },
            },
          },
        },
      ],
    },
    orderBy: { sequence: "asc" },
    take: 100,
    select: {
      id: true,
      description: true,
      learningOutcome: {
        select: {
          id: true,
          description: true,
          contentStandard: {
            select: {
              id: true,
              description: true,
              subStrand: {
                select: {
                  id: true,
                  name: true,
                  strand: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  return rows.map((r) => ({
    strandId: r.learningOutcome.contentStandard.subStrand.strand.id,
    strandName: r.learningOutcome.contentStandard.subStrand.strand.name,
    subStrandId: r.learningOutcome.contentStandard.subStrand.id,
    subStrandName: r.learningOutcome.contentStandard.subStrand.name,
    contentStandardId: r.learningOutcome.contentStandard.id,
    contentStandardLabel: r.learningOutcome.contentStandard.description,
    learningOutcomeId: r.learningOutcome.id,
    learningOutcomeLabel: r.learningOutcome.description,
    learningIndicatorId: r.id,
    learningIndicatorLabel: r.description,
  }));
}

export async function getLearningIndicatorPath(
  learningIndicatorId: string,
): Promise<LearningIndicatorPath | null> {
  const indicator = await prisma.learningIndicator.findUnique({
    where: { id: learningIndicatorId },
    select: {
      id: true,
      learningOutcome: {
        select: {
          id: true,
          contentStandard: {
            select: {
              id: true,
              subStrand: {
                select: {
                  id: true,
                  strand: {
                    select: { id: true, subjectId: true, classLevelId: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!indicator) return null;

  const outcome = indicator.learningOutcome;
  const standard = outcome.contentStandard;
  const subStrand = standard.subStrand;
  const strand = subStrand.strand;

  return {
    subjectId: strand.subjectId,
    classLevelId: strand.classLevelId,
    strandId: strand.id,
    subStrandId: subStrand.id,
    contentStandardId: standard.id,
    learningOutcomeId: outcome.id,
    learningIndicatorId: indicator.id,
  };
}

export async function getLearningIndicatorTextPath(
  learningIndicatorId: string,
): Promise<LearningIndicatorTextPath | null> {
  const indicator = await prisma.learningIndicator.findUnique({
    where: { id: learningIndicatorId },
    select: {
      description: true,
      learningOutcome: {
        select: {
          description: true,
          contentStandard: {
            select: {
              description: true,
              subStrand: {
                select: {
                  name: true,
                  strand: {
                    select: {
                      name: true,
                      subject: { select: { name: true } },
                      classLevel: { select: { name: true } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!indicator) return null;

  const outcome = indicator.learningOutcome;
  const standard = outcome.contentStandard;
  const subStrand = standard.subStrand;
  const strand = subStrand.strand;

  return {
    subject: strand.subject.name,
    classLevel: strand.classLevel.name,
    strand: strand.name,
    subStrand: subStrand.name,
    contentStandard: standard.description,
    learningOutcome: outcome.description,
    learningIndicator: indicator.description,
  };
}

/** Minimal official-text reference to a curriculum node, shared by the reverse-relationship and full-context queries below. */
export interface CurriculumRef {
  id: string;
  code: string | null;
  description: string;
}

export interface LearningOutcomeReverseRelationships {
  id: string;
  code: string | null;
  description: string;
  primaryContentStandard: CurriculumRef;
  /** Content Standards this Learning Outcome is ADDITIONALLY linked to, via `LearningOutcomeContentStandardLink` — never the primary one above, never duplicated into it. */
  additionalContentStandards: CurriculumRef[];
  learningIndicators: CurriculumRef[];
}

/**
 * For a single Learning Outcome, resolves its primary Content Standard, any
 * additional linked Content Standards, and its Learning Indicators — the
 * reverse-relationship capability Checkpoint 7 requires so a future AI
 * context builder (Checkpoint 8) can see the complete official curriculum
 * picture for a Learning Outcome, not just its one primary parent. Not
 * currently called from any teacher-facing route.
 */
export async function getLearningOutcomeReverseRelationships(
  learningOutcomeId: string,
): Promise<LearningOutcomeReverseRelationships | null> {
  const outcome = await prisma.learningOutcome.findUnique({
    where: { id: learningOutcomeId },
    select: {
      id: true,
      code: true,
      description: true,
      contentStandard: { select: { id: true, code: true, description: true } },
      additionalContentStandardLinks: {
        select: { contentStandard: { select: { id: true, code: true, description: true } } },
      },
      learningIndicators: {
        orderBy: { sequence: "asc" },
        select: { id: true, code: true, description: true },
      },
    },
  });

  if (!outcome) return null;

  return {
    id: outcome.id,
    code: outcome.code,
    description: outcome.description,
    primaryContentStandard: outcome.contentStandard,
    additionalContentStandards: outcome.additionalContentStandardLinks.map((l) => l.contentStandard),
    learningIndicators: outcome.learningIndicators,
  };
}

export interface CurriculumContext {
  curriculumVersion: {
    id: string;
    name: string;
    year: number | null;
    status: string;
    issuingAuthority: string | null;
  };
  subject: { id: string; name: string; code: string };
  classLevel: { id: string; name: string };
  strand: CurriculumRef;
  subStrand: CurriculumRef;
  contentStandard: {
    primary: CurriculumRef;
    /** Additional Content Standards linked to this Learning Indicator's Learning Outcome — see `LearningOutcomeContentStandardLink`. */
    additional: CurriculumRef[];
  };
  learningOutcome: CurriculumRef & {
    guidance: {
      twentyFirstCenturySkills: string | null;
      gesi: string | null;
      sel: string | null;
      nationalCoreValues: string[];
    } | null;
  };
  learningIndicator: CurriculumRef & {
    guidance: {
      pedagogicalExemplars: string[];
      assessmentCode: string | null;
      dokLevels: number[];
      dokDescriptions: string[];
    } | null;
  };
}

/**
 * The complete, read-only curriculum context for one Learning Indicator —
 * codes, the primary Content Standard AND any additional linked ones,
 * official Category B guidance, and curriculum version/source metadata.
 * Built for later planner/AI use once a teacher completes Step 2 (see
 * Checkpoint 7 item 17); nothing here is sent to an AI provider yet — that
 * remains `ai-context.service.ts`'s narrower, `.strict()`-schema-validated
 * `AICurriculumContext`, which Checkpoint 8 will decide whether to extend.
 */
export async function getCurriculumContext(
  learningIndicatorId: string,
): Promise<CurriculumContext | null> {
  const indicator = await prisma.learningIndicator.findUnique({
    where: { id: learningIndicatorId },
    select: {
      id: true,
      code: true,
      description: true,
      guidance: {
        select: {
          pedagogicalExemplars: true,
          assessmentCode: true,
          dokLevels: true,
          dokDescriptions: true,
        },
      },
      learningOutcome: {
        select: {
          id: true,
          code: true,
          description: true,
          guidance: {
            select: { twentyFirstCenturySkills: true, gesi: true, sel: true, nationalCoreValues: true },
          },
          contentStandard: {
            select: {
              id: true,
              code: true,
              description: true,
              subStrand: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                  strand: {
                    select: {
                      id: true,
                      code: true,
                      name: true,
                      subject: { select: { id: true, name: true, code: true } },
                      classLevel: { select: { id: true, name: true } },
                      curriculumVersion: {
                        select: { id: true, name: true, year: true, status: true, issuingAuthority: true },
                      },
                    },
                  },
                },
              },
            },
          },
          additionalContentStandardLinks: {
            select: { contentStandard: { select: { id: true, code: true, description: true } } },
          },
        },
      },
    },
  });

  if (!indicator) return null;

  const outcome = indicator.learningOutcome;
  const standard = outcome.contentStandard;
  const subStrand = standard.subStrand;
  const strand = subStrand.strand;

  return {
    curriculumVersion: strand.curriculumVersion,
    subject: strand.subject,
    classLevel: strand.classLevel,
    strand: { id: strand.id, code: strand.code, description: strand.name },
    subStrand: { id: subStrand.id, code: subStrand.code, description: subStrand.name },
    contentStandard: {
      primary: { id: standard.id, code: standard.code, description: standard.description },
      additional: outcome.additionalContentStandardLinks.map((l) => l.contentStandard),
    },
    learningOutcome: {
      id: outcome.id,
      code: outcome.code,
      description: outcome.description,
      guidance: outcome.guidance,
    },
    learningIndicator: {
      id: indicator.id,
      code: indicator.code,
      description: indicator.description,
      guidance: indicator.guidance,
    },
  };
}

// --- Existence checks (used by the service layer to distinguish an
// invalid/unknown parent id from a valid parent with no children yet) ---

export async function subjectExists(id: string): Promise<boolean> {
  return (await prisma.subject.count({ where: { id } })) > 0;
}

export async function classLevelExists(id: string): Promise<boolean> {
  return (await prisma.classLevel.count({ where: { id } })) > 0;
}

/** Filters `ids` down to the ones that are real subjects — used to validate a teacher profile's subject list. */
export async function filterExistingSubjectIds(ids: string[]): Promise<string[]> {
  if (ids.length === 0) return [];
  const rows = await prisma.subject.findMany({ where: { id: { in: ids } }, select: { id: true } });
  return rows.map((r) => r.id);
}

/** Filters `ids` down to the ones that are real class levels — used to validate a teacher profile's class list. */
export async function filterExistingClassLevelIds(ids: string[]): Promise<string[]> {
  if (ids.length === 0) return [];
  const rows = await prisma.classLevel.findMany({
    where: { id: { in: ids } },
    select: { id: true },
  });
  return rows.map((r) => r.id);
}

export async function strandExists(id: string): Promise<boolean> {
  return (await prisma.strand.count({ where: { id } })) > 0;
}

export async function subStrandExists(id: string): Promise<boolean> {
  return (await prisma.subStrand.count({ where: { id } })) > 0;
}

export async function contentStandardExists(id: string): Promise<boolean> {
  return (await prisma.contentStandard.count({ where: { id } })) > 0;
}

export async function learningOutcomeExists(id: string): Promise<boolean> {
  return (await prisma.learningOutcome.count({ where: { id } })) > 0;
}

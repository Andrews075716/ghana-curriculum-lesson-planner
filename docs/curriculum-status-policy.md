# Curriculum Eligibility Policy

[← Back to documentation home](README.md)

This is the single source of truth for who can see a curriculum record and
when it may be handed to an AI provider. It was written to close the one
open policy question left by [checkpoint-7-audit.md](checkpoint-7-audit.md)
(row 18), before Checkpoint 8 (AI integration) begins.

## The schema has two independent status fields, not one

Every node in the curriculum hierarchy (`Strand`, `SubStrand`,
`ContentStandard`, `LearningOutcome`, `LearningIndicator`) carries two
separate, independently-set fields — see `prisma/schema.prisma`:

| Field | Values | Set by |
|---|---|---|
| `extractionStatus` | `EXTRACTED` \| `NEEDS_REVIEW` \| `REJECTED` \| `null` | the import pipeline, never a person |
| `reviewStatus` | `PENDING` \| `APPROVED` \| `REJECTED` \| `null` | a human `CURRICULUM_ADMIN`, never the import pipeline |

`null` on `extractionStatus` occurs only on a small legacy slice of rows (4–13
per level) — the original pre-Checkpoint-6 Computing/Form-1 seed data, which
predates this status system entirely.

**`extractionStatus`'s meaning is easy to misread.** `EXTRACTED` is the
*clean, high-confidence* terminal state the importer reaches for the large
majority of records (77–98% at every level) — it does **not** mean "raw and
unvalidated." `NEEDS_REVIEW` is the *flagged-for-a-human* state: every single
`NEEDS_REVIEW` row carries an explanatory `reviewNote` (typos, OCR garbling,
printed code collisions, ambiguous source wording, or a structural
correction made during Checkpoint 6's Content-Standard/Learning-Outcome
re-parenting) — see `docs/curriculum-extraction-report.md`'s "NEEDS_REVIEW
semantics breakdown." **A `NEEDS_REVIEW` flag does not mean the official
curriculum wording is wrong** — in the large majority of cases the flag is
about a printed code, page layout, or hierarchy placement issue, not the
substance of the text.

As of 2026-09-30, **`reviewStatus` is `PENDING` for 100% of all 4,310+
curriculum rows** — 0 are `APPROVED`, 0 are `REJECTED`. Human review hasn't
started; this is "always-pending by design," not a bug (see the extraction
report). A literal reading of "only show `APPROVED` records" would therefore
make Create Planner show nothing at all today.

## Status counts (2026-09-30)

| | `EXTRACTED` | `NEEDS_REVIEW` | `null` (legacy, pre-status-system) | `REJECTED` |
|---|---|---|---|---|
| Strand | 350 | 0 | 2 | 0 |
| SubStrand | 675 | 108 | 4 | 0 |
| ContentStandard | 792 | 287 | 4 | 0 |
| LearningOutcome | 998 | 153 | 6 | 0 |
| LearningIndicator | 2374 | 683 | 13 | 0 |

`reviewStatus`: `PENDING` for every row above; 0 `APPROVED`, 0 `REJECTED`, at
every level.

## Policy

| Status combination | Teacher planner | AI curriculum context | Admin |
|---|---|---|---|
| `reviewStatus = APPROVED` | Visible | Eligible | Visible |
| `extractionStatus = EXTRACTED`, `reviewStatus` not `REJECTED` | Visible | Eligible (if `sourcePage` present) | Visible |
| `extractionStatus = NEEDS_REVIEW`, `reviewStatus = APPROVED` | Visible | Eligible (human override) | Visible, flagged |
| `extractionStatus = NEEDS_REVIEW`, `reviewStatus = PENDING` (unresolved) | Visible ("current development use") | **Not eligible** | Visible, flagged |
| `extractionStatus = null` (legacy pre-status-system rows) | Visible (preserves existing behaviour) | **Not eligible** (can't confirm it's a clean extraction) | Visible |
| `extractionStatus = REJECTED` **or** `reviewStatus = REJECTED` | **Hidden** | **Never eligible** | Visible |

Rule of thumb: **teacher visibility is "not rejected"; AI eligibility is
"not rejected, AND (clean extraction or human-approved), AND has a recorded
source page."**

### Why this differs from the most literal reading of "hide EXTRACTED"

An earlier draft of this policy used `EXTRACTED` as a synonym for "raw,
unvalidated data" and `APPROVED` as the only teacher-visible status. Given
`extractionStatus`'s real meaning (above) and that 0 rows are `APPROVED`
today, that literal reading would hide ~77%+ of the curriculum — including
every subject the Checkpoint 7 test suite exercises — from every teacher,
today. That would have been a severe, undiscussed regression, so this policy
instead **preserves current teacher-visible behaviour exactly** (nothing new
is hidden from teachers; only `REJECTED` — currently zero rows — would be)
and applies the stricter, fail-closed reading to the one dimension that
actually needs new safety: **what an AI provider is allowed to see.**

### The distinction the data model genuinely cannot make

The extraction report's "NEEDS_REVIEW semantics breakdown" table separates
`NEEDS_REVIEW` rows into "Checkpoint 6 structural correction" vs. "Phase 5
extraction-time flag" categories — but that split exists **only as an
aggregate count in a markdown document**, not as a queryable per-row field.
The only per-row explanation is `reviewNote`, which is free-text prose (a
sample of real `reviewNote` values confirms this — see the commit that added
this document), not a structured/taggable category. **There is no way to
tell, per record, whether a given `NEEDS_REVIEW` flag has already been
effectively resolved (a garbled code that's obviously correctable) versus
one that's genuinely still ambiguous, without parsing natural language —
which this policy deliberately does not do**, per the "do not create a
heuristic that guesses" instruction that prompted this document. This is why
`isEligibleForAiContext()` excludes *all* `NEEDS_REVIEW` records with
`reviewStatus: PENDING`, with no exceptions: it's not that every such record
is actually unsafe, it's that the system cannot currently tell which ones
are. The only way out of this bucket for a specific record is a human
setting `reviewStatus: APPROVED` on it.

### Source provenance

The policy's "has valid source provenance" AI-eligibility requirement is
implemented as `sourcePage !== null`, not `sourceDocument !== null` —
**`sourceDocument` is `null` on literally every curriculum row (0 of 1083 /
1157 / 3070 sampled)**; the field is declared in the schema but never
populated by the import pipeline. `sourcePage` (and `sourcePdfPageIndex`) is
populated on 99%+ of rows and is the real, working provenance signal today.

## Implementation

**Central policy module:** `src/server/services/curriculum-eligibility.service.ts`
— the only place `extractionStatus`/`reviewStatus` business logic should
live. Exports:
- `isVisibleToTeacher(fields)` — pure predicate, `true` unless rejected by
  either field.
- `isEligibleForAiContext(record)` — pure predicate implementing the fail-closed
  rule above; requires `sourcePage`.
- `isVisibleToAdmin(fields)` — always `true`; kept as an explicit named
  function (not "just don't filter") so every visibility decision has one
  obvious place to look.
- `teacherVisibleStatusWhere<T>()` — the Prisma `where`-fragment equivalent
  of `isVisibleToTeacher`, for filtering at the database layer rather than
  fetching then discarding rows in JS.

**Teacher-facing queries** (`src/server/repositories/curriculum.repository.ts`):
`listStrands`, `listSubStrands`, `listContentStandards`,
`listLearningOutcomes` (both the primary and the hybrid additional-link
branch), `listLearningIndicators`, and `searchLearningIndicators` all spread
`teacherVisibleStatusWhere()` into their `where` clause. `listSubjects` /
`listClassLevels` need no filter — those two models have no status fields.
Record statuses were **not** changed anywhere; this is filtering policy, not
a data migration.

**AI context boundary** (`src/server/services/curriculum.service.ts`):
`getAiEligibleCurriculumContext(learningIndicatorId)` is the one sanctioned
entry point for handing curriculum data to an AI provider — see "Official
vs. AI-generated data" below. It:
1. Resolves the full chain's status/provenance fields via
   `curriculum.repository.ts`'s `getCurriculumEligibilityChain`.
2. Checks `isEligibleForAiContext` against every **required** node (Strand,
   Sub-Strand, primary Content Standard, Learning Outcome, Learning
   Indicator) and fails closed — returns `{ eligible: false, ineligibleReason }`
   naming the specific failing level — if any one of them isn't eligible.
3. Filters **additional** linked Content Standards individually rather than
   failing the whole chain over one of them — they're supplementary context,
   not load-bearing.
4. On success, returns `{ eligible: true, context }` where `context` is the
   same official-curriculum-text shape `getCurriculumContext` already
   returns (see `docs/checkpoint-7-audit.md` row 17) — status fields
   themselves are never included in what's handed onward.

The intended flow, once Checkpoint 8 exists:

```
Teacher selection (Learning Indicator id)
        |
getAiEligibleCurriculumContext()   <-- curriculum-eligibility.service.ts policy applied here
        |
{ eligible: true, context }  or  { eligible: false, ineligibleReason }
        |
   AI provider  (only ever sees `context`, never raw curriculum tables)
```

**Deliberately not wired into the existing AI-assist feature yet.** This
codebase already has a working `ai-context.service.ts` /
`buildAICurriculumContext` used by the shipped AI-assist panel — rewiring it
to call through `getAiEligibleCurriculumContext` would be modifying AI
generation behaviour, which is out of scope for this change (see the
Checkpoint 7 recovery instructions: "Do not modify AI generation"). It's on
Checkpoint 8 to adopt this boundary in front of whatever calls the AI
provider next.

## Official vs. AI-generated data

A strict boundary is preserved between the two:

**Official curriculum data** (Subject, Class/Form, Strand, Sub-Strand,
Content Standard, Learning Outcome, Learning Indicator, curriculum codes,
official guidance, source/version metadata) is never written by AI. Nothing
in this change gives any AI-facing code a write path to any curriculum
table — `getAiEligibleCurriculumContext` is read-only, and every curriculum
mutation endpoint (`/api/admin/curriculum/*`) remains gated to
`CURRICULUM_ADMIN` only, unrelated to this policy.

**AI-generated lesson content** (Essential Questions, starter/teacher/learner
activities, pedagogical strategies, differentiation, GESI/SEL/National
Values integration, resources, DoK-aligned assessment, closure, reflection
prompts) is teacher-authored/reviewed planner content that may, in a future
Checkpoint, be informed by curriculum context — but it is stored on
`LessonPlanner`/`Lesson` and its child tables, never on any curriculum
table, so it can never be mistaken for official curriculum text later.

## Tests

`scripts/test-curriculum-status-policy.ts` — 30 assertions:
- Every status combination in the table above, against the pure policy
  functions directly.
- A live end-to-end check (real tagged fixtures, real HTTP calls) that a
  `REJECTED` `Strand` (by either field) is excluded from
  `/api/curriculum/strands` while `EXTRACTED` and `NEEDS_REVIEW` strands
  remain visible — confirming the database-layer filter actually works, not
  just the pure functions.
- `getAiEligibleCurriculumContext` failing closed when a Content Standard in
  the chain is `REJECTED`, naming the failing level; succeeding for a fully
  clean chain; and filtering out (not failing on) an ineligible *additional*
  linked Content Standard.

Re-ran the full pre-existing Checkpoint 7 suite afterward with no changes
needed: 58 + 72 + 20 + 42 + 27 + 55 + 33 = 307 assertions, 0 failures — the
new status filtering does not change any currently-visible teacher-facing
result (see the status counts table: 0 `REJECTED` rows exist today, so the
new filter is a no-op against the real database until a record is actually
rejected).

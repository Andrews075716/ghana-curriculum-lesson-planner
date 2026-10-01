# Curriculum Eligibility Policy

[← Back to documentation home](README.md)

This is the single source of truth for who can see a curriculum record and
when it may be handed to an AI provider. It was written to close the one
open policy question left by [checkpoint-7-audit.md](checkpoint-7-audit.md)
(row 18), before Checkpoint 8 (AI integration) begins.

## Policy revision (2026-10-01): human review status is independent of AI usability

Manual browser acceptance testing demonstrated that the original policy
(below, kept for history) unnecessarily blocked AI lesson generation for
valid curriculum selections in subjects such as Computing — specifically,
every `NEEDS_REVIEW`/`PENDING` record and every legacy `extractionStatus =
null` record was excluded from AI context, purely because of its status,
even when the record was otherwise a structurally valid, non-rejected,
fully traceable piece of official curriculum text.

The policy now separates four previously-conflated concepts explicitly:

| Concept | Governed by |
|---|---|
| Teacher visibility | `isVisibleToTeacher` — unaffected by this revision |
| AI usability | `isEligibleForAiContext` — **revised**: no longer reads `extractionStatus`/`reviewStatus` at all |
| Human review status | `reviewStatus`, set only by a `CURRICULUM_ADMIN` — unaffected; still exists for curriculum QA |
| Rejection | `extractionStatus === "REJECTED"` or `reviewStatus === "REJECTED"` — unaffected, still fail-closed |

**`isEligibleForAiContext` now has exactly two gates, both of which were
already real, data-backed signals (not status labels):**
1. Not rejected, by either field — unchanged, still fail-closed.
2. Has a recorded source page (`sourcePage !== null`), unless the node type
   is explicitly provenance-exempt (`Strand` only — see below) — unchanged,
   still required.

`NEEDS_REVIEW`+`PENDING` alone, and legacy `extractionStatus = null` alone,
no longer appear in this check at all. `reviewStatus = APPROVED` is no
longer a *requirement* for AI eligibility either — it was never actually
needed once `EXTRACTED`-or-`APPROVED` stopped being the gate; the two
remaining gates (rejection, provenance) are status-independent.

**Why this is safe:** `NEEDS_REVIEW` means "flagged for a human to look at"
— typically a printed code collision, OCR garbling, or a structural
re-parenting correction — not "the wording is wrong" (see the original
"extractionStatus's meaning is easy to misread" section below, unchanged).
The legacy `extractionStatus = null` rows predate the status system
entirely but are real seed data, already teacher-visible, already used in
planners today. Neither status says anything about whether the record is
traceable to an official source page or whether it's been rejected — the
two things that actually matter for AI safety. Human review remains
meaningful for its own purpose (curriculum QA, OCR anomalies, editorial
correctness, future administrative review) — it just no longer doubles as
an AI gate it was never a precise proxy for.

**What this does NOT change:** rejection remains fail-closed exactly as
before. Provenance (`sourcePage`) remains required exactly as before, with
the same `Strand`-only exemption. No curriculum record's `extractionStatus`,
`reviewStatus`, or `reviewNote` was modified by this change — this is a
filtering-policy change in application code, not a data migration. The
official-curriculum-is-never-AI-written boundary (see "Official vs.
AI-generated data" below) is completely unaffected.

**A concrete, honest consequence of this revision:** the exact Computing
Learning Indicator used in the original manual-browser-acceptance report
(`COMP-F1-STR-01-SS-01-CS-01-LI-01`) is **still AI-ineligible** after this
change — not because of its status anymore, but because its Sub-Strand,
Content Standard, Learning Outcome, and Learning Indicator all have
`sourcePage = null` (it's part of the 29-row legacy pre-Checkpoint-6 seed
slice, which predates the extraction pipeline that populates `sourcePage`
entirely — see "Legacy null-extractionStatus audit" below). Computing as a
*subject* has an AI-usable path (confirmed by the 33-subject test — see
`scripts/test-ai-eligibility-all-subjects.ts`), just not through this one
specific legacy fixture. This was deliberately not special-cased or
weakened to make that one fixture pass — see "Why provenance was not
relaxed for the legacy slice" below.

### Legacy null-extractionStatus audit

All 29 `extractionStatus = null` rows (2 Strand, 4 SubStrand, 4
ContentStandard, 6 LearningOutcome, 13 LearningIndicator — all under
Computing/Form-1's two original seed Strands) also have `sourcePage = null`.
This was confirmed by direct query before writing this revision, not
assumed. These rows remain AI-ineligible under the revised policy, for the
concrete, correct reason (no recorded source page), not because of their
null status.

### Why provenance was not relaxed for the legacy slice

It was considered whether `sourcePage` should also be waived for this
legacy slice, the same way `sourceDocument` is already waived everywhere
(it's `null` on every curriculum row — the import pipeline never populates
it). The two cases are not the same: `sourceDocument` is null everywhere
because the field is simply unused by the current pipeline, while
`sourcePage` is the real, populated provenance signal for 99%+ of the
database — its absence specifically on this 29-row legacy slice may mean
this seed data was hand-authored before the PDF-extraction pipeline existed
and was never traced back to an official document page at all, rather than
merely missing a metadata field. Waiving it would be guessing at
traceability the system cannot actually confirm, which is exactly the kind
of heuristic this document's original policy refused to introduce (see
"The distinction the data model genuinely cannot make" below). This is left
as an open question for a human curriculum admin to resolve, not decided
here.

### Full-hierarchy coverage, after this revision (2026-10-01)

Computed by `scripts/test-ai-eligibility-all-subjects.ts` across every one
of the 3,070 Learning Indicators in the database:

| | Count |
|---|---|
| Total Learning Indicators | 3,070 |
| Teacher-visible (not rejected) | 3,070 |
| AI-usable | 3,057 |
| Blocked — `REJECTED` | 0 |
| Blocked — structural (broken chain) | 0 |
| Blocked — missing provenance | 13 (exactly the legacy Computing/Form-1 slice) |

33/33 subjects have at least one AI-usable curriculum path.

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

## Policy (original, 2026-09-30 — superseded by the 2026-10-01 revision above; kept for history)

| Status combination | Teacher planner | AI curriculum context | Admin |
|---|---|---|---|
| `reviewStatus = APPROVED` | Visible | Eligible | Visible |
| `extractionStatus = EXTRACTED`, `reviewStatus` not `REJECTED` | Visible | Eligible (if `sourcePage` present) | Visible |
| `extractionStatus = NEEDS_REVIEW`, `reviewStatus = APPROVED` | Visible | Eligible (human override) | Visible, flagged |
| `extractionStatus = NEEDS_REVIEW`, `reviewStatus = PENDING` (unresolved) | Visible ("current development use") | **Not eligible** | Visible, flagged |
| `extractionStatus = null` (legacy pre-status-system rows) | Visible (preserves existing behaviour) | **Not eligible** (can't confirm it's a clean extraction) | Visible |
| `extractionStatus = REJECTED` **or** `reviewStatus = REJECTED` | **Hidden** | **Never eligible** | Visible |

Rule of thumb (original, superseded): **teacher visibility is "not
rejected"; AI eligibility is "not rejected, AND (clean extraction or
human-approved), AND has a recorded source page."** As of the 2026-10-01
revision above, the "(clean extraction or human-approved)" clause was
removed — AI eligibility is now "not rejected, AND has a recorded source
page," full stop.

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
the *original* `isEligibleForAiContext()` excluded *all* `NEEDS_REVIEW`
records with `reviewStatus: PENDING`, with no exceptions: it's not that
every such record was actually unsafe, it's that the system couldn't tell
which ones were, from status alone. **This reasoning is still correct — it
just turned out review status was never actually standing in for AI safety
in the first place.** The 2026-10-01 revision above didn't resolve this
per-record ambiguity by inspecting `reviewNote`; it recognized that AI
safety was never really about resolving it — rejection and provenance are
the two things that are actually, concretely verifiable per record, and
those remain fail-closed exactly as before.

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
  rule: not rejected, and (unless exempt) has a recorded `sourcePage`. See
  the "Policy revision (2026-10-01)" section above — `extractionStatus`/
  `reviewStatus` are no longer read by this function at all.
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

`scripts/test-curriculum-status-policy.ts` — 38 assertions (updated
2026-10-01 for the policy revision):
- Every status combination against the pure policy functions directly,
  including the revised matrix: `NEEDS_REVIEW`/`PENDING` and legacy
  null-`extractionStatus` are now AI-eligible when structurally valid and
  provenance-complete; the same two combinations without a recorded
  `sourcePage` remain AI-ineligible, for that concrete reason.
- A live end-to-end check (real tagged fixtures, real HTTP calls) that a
  `REJECTED` `Strand` (by either field) is excluded from
  `/api/curriculum/strands` while `EXTRACTED` and `NEEDS_REVIEW` strands
  remain visible — confirming the database-layer filter actually works, not
  just the pure functions.
- `getAiEligibleCurriculumContext` failing closed when a Content Standard in
  the chain is `REJECTED`, naming the failing level; succeeding for a fully
  clean chain; filtering out (not failing on) an ineligible *additional*
  linked Content Standard; and three new end-to-end cases confirming a
  `NEEDS_REVIEW`/`PENDING` primary Content Standard, and a legacy-null one,
  both now succeed, while one missing `sourcePage` still fails closed.

`scripts/test-ai-eligibility-all-subjects.ts` (new, 2026-10-01) — validates
the revision against the complete real database, not fixtures: per-subject
smoke test (33/33 subjects have at least one AI-usable path), a
full-hierarchy coverage count (see "Full-hierarchy coverage" above), the
exact Computing regression fixture, and the Agriculture regression fixture.
Zero Anthropic calls — context construction only.

`scripts/test-checkpoint9-e2e.ts` section 2 — updated 2026-10-01: previously
asserted an unresolved `NEEDS_REVIEW` selection was refused; now asserts it
SUCCEEDS (reaches the mock provider) when structurally valid and
provenance-complete, and separately confirms a genuinely `REJECTED` Content
Standard is still correctly refused.

Re-ran the full pre-existing Checkpoint 7 suite afterward with no changes
needed: 58 + 72 + 20 + 42 + 27 + 55 + 33 = 307 assertions, 0 failures — the
teacher-visibility filter (`isVisibleToTeacher`/`teacherVisibleStatusWhere`)
is completely unaffected by this revision; only AI eligibility changed.

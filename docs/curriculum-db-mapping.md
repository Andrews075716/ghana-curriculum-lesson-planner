# Phase 6 — Official Curriculum Structure vs. Current Application Database

Status: analysis only. **No schema changes have been made.** Per the task's execution
rules, this is presented for review before any migration is written or run.

Source for the "current DB" column: `prisma/schema.prisma` (full read), plus the
curriculum-import pipeline in `src/server/services/curriculum-import/` and
`docs/04-curriculum-architecture.md`. Source for "official curriculum element":
originally the Physics and Robotics inventories only; **updated below now that all
33 subjects have been inventoried** — see `docs/curriculum-source-inventory.md` for
the consolidated findings.

### Two additional gaps found once all 33 subjects were inventoried

| Official curriculum element | Current model | Compatible? | Required change |
|---|---|---|---|
| Branching option/pathway (Applied Technology, Design and Communication Technology split into 3 named tracks in Years 2–3) | *(none — `Strand`/`ClassLevel` have no concept of an optional sub-track)* | ❌ No | Add `pathway String?` to `Strand` (additive, nullable, `null` for the ~31 subjects that don't branch) |
| Non-globally-unique Learning Indicator/Assessment codes within a Sub-Strand (Agricultural Science: numbering restarts per Content Standard) | `LearningIndicator.code String? @unique` — a database-wide unique constraint | ⚠️ Partial | The extractor must disambiguate the *stored* code (e.g. append the Content Standard's own sequence) before import, since the column's global uniqueness constraint would otherwise reject a legitimately-repeated printed code from a different Content Standard within the same document |
| **CONFIRMED to also affect Agriculture** (the separate SHTS/TVET-track subject, `data/curriculum/agriculture.json`) — same restart-per-Content-Standard pattern as Agricultural Science, **plus a more severe variant**: several Content Standards print two genuinely different Learning Indicators under the identical code (not merely a restart against a different Content Standard, but a true duplicate within one Content Standard, e.g. `1.5.3.LI.1` printed twice under `1.5.3CS.1`, and `2.3.1.LI.1` printed twice under `2.3.1.CS.1`). Agriculture also has one confirmed duplicate Learning Outcome code within a single Sub-Strand (`2.1.2.LO.1` printed twice, Year Two Strand 1 Sub-Strand 2, for two different LOs). | `LearningIndicator.code @unique` and (if a similar constraint is ever added) any future `LearningOutcome.code @unique` | ⚠️ Partial | Same mitigation as above (disambiguate the stored code before import), but the within-Content-Standard duplicate case means disambiguating by Content-Standard-sequence alone is *not* sufficient for Agriculture — the stored code must also incorporate the Learning Indicator's own sequence-within-Content-Standard (already the extraction-time `sequence` field in `agriculture.json`) to be safely unique. Every affected node in `agriculture.json` is flagged `codeCollisionWith`/`codeDuplicationNote`/`NEEDS_REVIEW` per node. |

Everything else identified in the original Physics/Robotics-only pass below held up
across all 33 subjects and needed no further correction (the core hierarchy, the
Category B guidance gap, and the provenance/review-status gap are all confirmed,
not just hypothesised from two subjects).

## Core hierarchy (Category A)

| Official element | Current model | Current field | Compatible? | Required change | Notes |
|---|---|---|---|---|---|
| Subject | `Subject` | `name`, `code` | ✅ Yes | None structurally. `code` isn't printed in the source PDFs — admin/import must assign one (already true today for Computing → `COMP`). | |
| Year/Level ("Year One/Two/Three" = SHS 1–3) | `ClassLevel` | `name`, `sequence` | ✅ Yes | None | |
| Strand | `Strand` | `name`, `code`, `sequence` | ⚠️ Partial | `code` is nullable+unique today, which is right since Strand has no printed code in the source (only Strand *number* + name) — current schema already handles this correctly via `sequence` as the ordering key. No change needed. | |
| Sub-Strand | `SubStrand` | `name`, `code`, `sequence` | ⚠️ Partial | Same as Strand — no printed code, `sequence` already covers ordering. No change needed. | |
| Content Standard | `ContentStandard` | `code`, `description`, `sequence` | ✅ Yes | None | Code `1.1.1.CS.1` fits the unique nullable `code` column. |
| Learning Outcome | `LearningOutcome` | `description`, `sequence` (no code column) | ✅ Yes | None | Matches source: LOs are numbered (`1.1.1.LO.1`) but the schema currently has no `code` column for `LearningOutcome` — **this is a real gap**, see below. |
| Learning Indicator | `LearningIndicator` | `code`, `description`, `sequence` | ✅ Yes | None | |
| Curriculum Code | Spread across each node's `code` column | — | ⚠️ Partial | See "Missing: LearningOutcome.code" below | |
| Curriculum Version / issuing authority / publication year | `CurriculumVersion` | `name`, `year`, `status` | ⚠️ Partial | No field for issuing authority (NaCCA) — currently would have to be encoded into `name` as free text, which is fragile. Add `issuingAuthority String?` (additive, non-breaking). | |

### Gap: `LearningOutcome` has no `code` column
The source documents assign a real code to every Learning Outcome (`1.1.1.LO.1`),
but `LearningOutcome` in the current schema has no `code` field — its identity is
`(contentStandardId, sequence)` only (confirmed in `docs/04-curriculum-architecture.md`:
*"`LearningOutcome` has no code — its identity is its position"*). This means the
official LO code, part of Category A and required to be preserved verbatim per the
task's rules, currently has nowhere to be stored. **Required change:** add
`code String? @unique` to `LearningOutcome`, mirroring `Strand`/`SubStrand`/
`ContentStandard`/`LearningIndicator`. Additive, backward-compatible.

## Category B — Official supporting guidance

| Official element | Current model | Compatible? | Required change |
|---|---|---|---|
| 21st Century Skills (per Learning Outcome) | *(none)* | ❌ No | New field/table needed |
| GESI / SEL / National Core Values (per Learning Outcome) | *(none — `CrossCuttingTheme` exists but is a planner-scoped controlled vocabulary, not curriculum-sourced text)* | ❌ No | New field/table needed |
| Pedagogical Exemplars (per Learning Indicator) | `PedagogicalExemplar` exists but is **planner-scoped only** (`plannerId` FK, teacher/AI-authored free text) | ❌ No | New curriculum-scoped table needed — do not reuse the planner table, its ownership/write model is different (`CURRICULUM_ADMIN`-only vs. teacher-authored) |
| Assessment / DoK guidance (per Learning Indicator) | `Assessment` exists but is **planner-scoped only** | ❌ No | New curriculum-scoped table/field needed |
| Teaching and Learning Resources (per Sub-Strand) | `TeachingLearningResource` exists but is **planner-scoped only** | ❌ No | New curriculum-scoped field/table needed |
| Suggested Activities | *(embedded inside Pedagogical Exemplars text, not separately modelled — matches the source, which doesn't separate them either)* | ✅ N/A | No separate model needed; covered by Pedagogical Exemplars text |
| Cross-Cutting Themes (document-level, generic) | `CrossCuttingTheme` (controlled vocabulary, planner-scoped) | ⚠️ Different concept | The source's cross-cutting-theme mentions are front-matter prose, not a per-node field — no schema change needed here; do not conflate with the existing `CrossCuttingTheme` picklist, which serves a different (teacher-selection) purpose |

**Summary: every Category B guidance element that the curriculum documents attach to
a specific Learning Outcome/Learning Indicator/Sub-Strand currently has no home in
the database.** The only existing tables with these names (`PedagogicalExemplar`,
`Assessment`, `TeachingLearningResource`) are deliberately scoped to `LessonPlanner`
(teacher/AI-authored), per the existing, correct Category A/C split documented in
`docs/04-curriculum-architecture.md`. Reusing them for curriculum-sourced official
text would incorrectly mix admin-owned official content with teacher-owned content
in the same table — **required change is new, separate, curriculum-scoped tables**,
e.g. `LearningOutcomeGuidance` (21CS/GESI/SEL/National Values, 1:1 with
`LearningOutcome`) and `LearningIndicatorGuidance` (Pedagogical Exemplars text, DoK
assessment guidance, 1:1 with `LearningIndicator`), plus a `subStrandResource` text
field or table on `SubStrand` for TLR.

## Provenance (Phase 4 requirement)

| Required field | Current model | Compatible? | Required change |
|---|---|---|---|
| Source document, page, section | *(none, anywhere)* | ❌ No | New nullable columns on `Strand`/`SubStrand`/`ContentStandard`/`LearningOutcome`/`LearningIndicator`: `sourceDocument String?`, `sourcePage Int?`, `sourcePdfPageIndex Int?` |
| Extraction status | *(none)* | ❌ No | New enum `ExtractionStatus { EXTRACTED NEEDS_REVIEW REJECTED }` + column, at minimum on `LearningIndicator` (the leaf); optionally on every level |
| Review/approval status | *(none — `CurriculumVersionStatus` is version-level only, not per-record)* | ❌ No | New enum `ReviewStatus { PENDING APPROVED REJECTED }` + column, same placement as extraction status |

## Import pipeline (Phase 12 requirement) vs. current `curriculum-import` service

| Requirement | Current state | Compatible? | Required change |
|---|---|---|---|
| Preserve hierarchy | ✅ Full tree preserved, one-to-many at every level | ✅ Yes | None |
| Preserve official wording/codes | ✅ Verbatim strings, `code` columns | ✅ Yes | None (once `LearningOutcome.code` is added, per above) |
| Preserve source references | ❌ `CurriculumTreeInput` has no provenance fields at all | ❌ No | Extend `CurriculumTreeInput` (and CSV columns) with the new provenance fields |
| Detect duplicates | ✅ `validateTrees` (in-file) + `diffAgainstDb` (against-DB) both implemented and tested | ✅ Yes | None |
| Avoid silently overwriting **approved** curriculum | ⚠️ Partial — `diffAgainstDb`/`commitCurriculumTree` will happily upsert-overwrite any existing row by code, with no concept of "this one is approved, block or warn" | ❌ No | Once `reviewStatus` exists, the diff step must classify an update to an `APPROVED` record as its own severity (e.g. a new `"warning"` or blocking `"error"` depending on policy) rather than a silent `update` |
| Support curriculum versions | ✅ `CurriculumVersion` exists; import upserts by version `name` | ⚠️ Partial | Works today but is "informational only" per `docs/17-project-status.md` — no selection-time filtering by status. Out of scope for the extraction/import work itself; flagged as a pre-existing gap. |
| Transactional | ✅ `commitCurriculumTree` runs inside `prisma.$transaction` | ✅ Yes | None |
| Import report | ✅ `ImportPreview`/`ImportCommitResult` counts by level | ✅ Yes | None, though counts should extend to the new Category B tables once they exist |

## Phase 11 — Human review mechanism

Checked: `src/app/(admin)/admin/curriculum/*` and `src/app/api/admin/curriculum/*`.
The admin surface today is full CRUD (subjects, class levels, versions, strands,
sub-strands, content standards, learning outcomes, learning indicators) plus the
import preview/commit pages — **there is no review queue**. Nothing lists records by
an extraction/review status, and nothing implements an EXTRACTED → NEEDS_REVIEW →
APPROVED/REJECTED workflow, because no such status exists on any curriculum row today
(confirmed above). `CurriculumVersionStatus` (`DRAFT`/`ACTIVE`/`ARCHIVED`) is a
version-wide flag, not a per-record review gate, and per `docs/17-project-status.md`
it isn't even enforced at selection time yet.

**Conclusion: the required review mechanism does not exist and must be built**, not
reused. Once the `reviewStatus`/`extractionStatus` columns above exist, the minimum
addition is:
- A new admin page, e.g. `/admin/curriculum/review`, listing curriculum nodes
  filtered by `reviewStatus = PENDING`, grouped by subject, with the verbatim
  extracted text, source page reference, and an Approve/Reject action per node
  (or per whole subject import batch).
- The teacher-facing curriculum selectors (`CurriculumSelectField`,
  `useCurriculumOptions`-backed routes) must filter to `reviewStatus = APPROVED`
  only, so a teacher can never select an unreviewed extraction — this is the
  concrete mechanism that satisfies "teachers must not unknowingly use unreviewed
  extracted curriculum as official approved curriculum."
- The import preview/commit routes should default newly-created rows to
  `EXTRACTED`/`PENDING`, never `APPROVED` — approval is a separate, explicit admin
  action, not an automatic outcome of a successful import.

This is additive to the existing CRUD/import surface, not a replacement of it.

## Net conclusion

The **core 7-level hierarchy is already well-modelled** and needs only one additive
field (`LearningOutcome.code`) plus an `issuingAuthority` field on
`CurriculumVersion` — both non-breaking. The **larger gap is Category B guidance and
provenance/review-status**, which have no representation at all today. All required
changes identified above are **additive** (new nullable columns, new enums, new
tables with FKs to existing curriculum tables) — nothing requires deleting or
restructuring existing tables or data. Given the current database holds only demo
seed data (Computing/Form 1, not sourced from these official PDFs), there is no
"existing approved curriculum data" at risk; this is flagged per the task's
execution rules anyway, and no migration will be run without explicit confirmation.

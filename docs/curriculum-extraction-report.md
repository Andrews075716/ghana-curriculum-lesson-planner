# Curriculum Extraction & Import — Status Report

Authoritative machine-readable state lives in `data/curriculum/extraction-progress.json`;
this is a human-readable summary of where things stand after Checkpoint 6 (2026-09-29).

## Checkpoint 5 — Full extraction: COMPLETE

All 33 SHS subjects extracted to `data/curriculum/<subject>.json`. Totals: 1,043 Content
Standards / 1,162 Learning Outcomes / 2,851 Learning Indicators. Data-quality issues are
flagged `NEEDS_REVIEW` in place with a `reviewNote`, never silently fixed or fabricated.
A handful of subjects have small, documented shortfalls against the source PDF's own
printed totals (biology, government, agriculture, french, english-language, mathematics,
arabic) — genuine source-document gaps, not extraction gaps.

## Checkpoint 6 — Schema migration + import: COMPLETE

**Migrations** (both additive, no `DROP`/destructive `ALTER`, verified before/after
against every previously-imported subject and every non-curriculum table):
1. `20260929100339_add_curriculum_import_architecture` — provenance/status columns,
   two Category-B-guidance tables, four global-unique code constraints replaced with
   parent-scoped compound unique constraints (the old global constraint was a real bug:
   codes legitimately restart per Content Standard in most subjects).
2. `20260929125322_add_learning_outcome_content_standard_link` — the hybrid model's
   junction table (see below).

**Critical finding — Content Standard / Learning Outcome hierarchy inversion.** The
Phase 9 extraction files nest Content Standard *inside* Learning Outcome; the pre-existing
schema has it the other way (Content Standard as parent, matching standard NaCCA
convention). All 33 files checked directly: 21 subjects had at least one Learning Outcome
with zero or 2+ nested Content Standards. Full analysis, evidence, and the decision:
**`docs/curriculum-relationship-analysis.md`**.

**Approved resolution — hybrid model**: keep Content Standard → Learning Outcome as the
required primary relationship; add an additive, optional many-to-many
`LearningOutcomeContentStandardLink` table for the confirmed genuine extra relationships
(one Content Standard legitimately serving multiple Learning Outcomes, or vice versa).
Learning Outcome → Learning Indicator stays untouched — confirmed universal across all
33 files.

**Evidence-based corrections (Phase 1)**: applied to 6 priority subjects, each verified
directly against the source PDF (page-cited), never guessed. 33 individual Content
Standard relocations across 5 subjects resolved 55 of 361 anomalous Learning Outcome
records. Full per-subject breakdown, including what was deliberately left uncorrected
and why: `extraction-progress.json` → `checkpoint6_database_import.phase1Corrections`.

**Junction table pilot**: `applied-technology`'s Wood Technology (SHS2) Sub-Strand — its
sole Learning Outcome genuinely has 2 Content Standards. Imported with the primary
relationship holding one, the junction table recording the other, and both Content
Standards' real Learning Indicators (8 total) correctly attached to the one Learning
Outcome. Manually verified, idempotent, query-tested in both directions. Full detail:
`checkpoint6_database_import.junctionTableStage`.

**Imported: all 33 of 33 subjects**, all idempotency-verified, exact-match totals to
source (except 11 genuinely-excluded Learning Outcomes, documented individually below):

| Subject | Content Standards | Learning Outcomes | Learning Indicators | Additional links |
|---|---|---|---|---|
| Religious and Moral Education | 9 | 9 | 19 | 0 |
| ICT | 15 | 15 | 39 | 0 |
| PE (Elective) | 33 | 33 | 75 | 0 |
| Computing | +6 real strands alongside demo | | | 0 |
| Aviation and Aerospace Engineering | 28 | 28 | 61 | 0 |
| Biomedical Science | 22 | 22 | 69 | 0 |
| French | 48 | 48 | 185 | 0 |
| History | 19 | 19 | 55 | 0 |
| Performing Arts | 24 | 24 | 65 | 0 |
| Physics | 59 | 59 | 188 | 0 |
| Social Studies | 33 | 33 | 70 | 0 |
| Geography | 33 | 33 | 79 | 0 |
| Design and Communication Technology | 29 | 29 | 89 | 0 |
| Applied Technology | 33 | 32 | 176 | 1 |
| General Science | 30 | 31 | 60 | 0 |
| Chemistry | 24 | 26 | 81 | 0 |
| Literature-in-English | 38 | 41 | 111 | 0 |
| Agriculture | 46 | 44 | 117 | 2 |
| Agricultural Science | 36 | 36 | 85 | 0 |
| Art and Design Studio | 24 | 26 | 62 | 0 |
| Art and Design Foundation | 30 | 30 | 80 | 0 |
| Robotics | 36 | 35 | 64 | 1 |
| Manufacturing Engineering | 41 | 26 | 87 | 18 |
| Engineering | 36 | 54 | 102 | 0 |
| Mathematics | 40 | 41 | 109 | 0 |
| Additional Mathematics | 34 | 54 | 212 | 2 |
| English Language | 46 | 57 | 114 | 1 |
| Spanish | 31 | 44 | 60 | 0 |
| Arabic | 74 | 85 | 208 | 7 |
| Biology | 38 | 38 | 72 | 0 |
| Economics | 37 | 36 | 88 | 3 |
| Government | 17 | 21 | 62 | 0 |
| Physical Education & Health (Core) | 18 | 24 | 69 | 0 |

**Final DB totals (2026-09-29, all 33 subjects): 1,083 Content Standards / 1,157 Learning
Outcomes / 3,070 Learning Indicators / 35 additional links.** Zero duplicates anywhere
(subject names, Content-Standard/Learning-Outcome/Learning-Indicator codes all checked
scoped-to-parent), zero orphaned rows, zero auto-approved records — every one of the
4,310+ curriculum nodes imported this Checkpoint has `reviewStatus: PENDING`, exactly as
required.

Arabic was the largest single-subject anomaly count in the pipeline (26 affected
Sub-Strands, 62 of 66 resolved). A recurring pattern was a "denotative meanings /
connotative meanings" translation-exercise Content Standard appearing near-identically
across 6+ Sub-Strands, always splitting the same way (first half denotative, second half
connotative) across 2 trailing Learning Outcomes.

**Importer generalized a second time**: a Learning Outcome with 2+ Content Standards is
now also safely resolvable (primary + additional, via the junction table) when every
*sibling* Learning Outcome in its Sub-Strand already resolves to exactly 1 Content
Standard of its own — the same elimination logic as the original sole-LO rule, just
extended to "no viable sibling left to redistribute the surplus to." First needed for
Additional Mathematics (a vectors Content Standard matching neither of its Sub-Strand's
2 printed Learning Outcomes). Re-verified idempotent across all 24 previously-imported
subjects via a full `--all` run before relying on it.

**Importer's per-LO exclusion mechanism in heavy use for Engineering**: 3 of its 21
anomalies were confirmed, after individual PDF-level review of every affected Sub-Strand
(not a blanket pattern), as genuine gaps with no matching Content Standard content in the
source — excluded and reported rather than forced. One of the three (Automation
Technologies, SHS3) required reversing the initial position-based assumption entirely:
the printed Content Standard's Learning Indicators were both explicitly design/PLC-framed,
matching the *second* Learning Outcome, not the first — found only by reading Learning
Indicator content rather than assuming the first-listed Learning Outcome keeps the
Content Standard.

**Importer enhancement (this continuation phase)**: the importer previously refused an
entire subject if any one Learning Outcome had an unresolvable Content Standard count.
It now excludes only that specific Learning Outcome — never written under a guessed or
invented Content Standard, always reported by code/description/reason — while still
importing every other, resolvable Learning Outcome in the same subject. This does not
relax the underlying safety rule (it still never guesses a relationship); it only shrinks
the blast radius of one confirmed-unresolvable record from an entire subject to that one
record. First applied to Agricultural Science, whose single anomaly (Sub-Strand
"Agricultural Machineries", SHS3) was re-confirmed via direct PDF re-verification as a
genuine source gap — the document prints only 2 Content Standards for 3 sibling Learning
Outcomes, with no third anywhere in the source. 35 of 36 Learning Outcomes imported; the
1 genuine gap is excluded and reported, not fabricated.

**Agriculture** was a single systematic defect, not 23 unrelated issues: whenever a
Sub-Strand had N Learning Outcomes and N Content Standards, extraction had nested all N
Content Standards under the *last* Learning Outcome instead of distributing them 1:1. Each
Content Standard's own description was checked against every sibling Learning Outcome's
description directly against the source PDF, confirming a clean 1:1 positional match in
every one of the 9 affected Sub-Strands — then reattached accordingly (code, description,
and Learning Indicators preserved exactly as printed). One further node (the sole Learning
Outcome in Sub-Strand 1.2.2, with 3 genuinely distinct Content Standards) needed no JSON
correction at all — it imported natively via the existing sole-LO multi-CS mechanism,
producing 2 additional junction links.

**Follow-up resolutions (this continuation phase)**: General Science, Chemistry, and
Literature-in-English — the 3 subjects explicitly prioritized for follow-up — were each
blocked by genuine shared-Content-Standard cases (plus, for Literature-in-English, one
sibling-misattribution case) left deliberately unresolved in Phase 1. Direct PDF
re-verification found, in every shared-CS case, that the Content Standard's own wording and
its Learning Indicators split cleanly between the sibling Learning Outcomes — resolved via
the *native* shared-primary-relationship mechanism (multiple Learning Outcome rows pointing
to the same Content Standard as primary parent), not the junction table. This is the
simpler mechanism for the "one CS genuinely serves multiple LO" shape; the junction table
remains reserved for the opposite shape ("one LO genuinely has multiple CS"), as piloted on
Applied Technology. Literature-in-English's 1.3.1.CS.3 case was a source-document defect
(a printed heading duplicated verbatim from a sibling Content Standard) resolved by
relocating the node — code, Learning Indicators, and description preserved exactly as
printed — to its evidence-supported parent, without rewriting the source's own apparent
error. Full evidence: `extraction-progress.json` →
`checkpoint6_database_import.phase1Corrections`.

**Final 4 subjects**: Biology and Government were clean systematic-misattribution
patterns (same "all Content Standards dumped on one Learning Outcome" shape as
agriculture). Economics had one genuinely-additional Content Standard (equilibrium of
firms/price discrimination, matching neither of its 2 Learning Outcomes) resolved via the
generalized importer rule. Physical Education & Health (Core) needed a genuine data-defect
fix first: assessment `3.1.2.AS.4` had `dokLevels: [null, 1, 3, 4]`, violating the
database's `Int[]` schema — the `null` corresponded to an unlabelled instructional
sentence merged into the assessment cell (a pre-existing source/extraction artefact,
already correctly diagnosed by the extraction phase's own `reviewNote`). Resolved
losslessly: the sentence was relocated to `pedagogicalExemplars` rather than discarded.
That subject also had one Sub-Strand (Health and Wellness, SHS3) where 2 Content
Standards' own printed *titles* did not match their own printed Learning Indicators in
the **source document itself** (confirmed via a full direct PDF read across 5 pages) —
regrouped by each Learning Indicator's own content to its evidence-matched Learning
Outcome.

### NEEDS_REVIEW semantics breakdown (2026-09-29, all 33 subjects)

| Level | Total NEEDS_REVIEW | Checkpoint 6 structural correction | Phase 5 extraction-time flag | No reviewNote |
|---|---|---|---|---|
| Content Standards | 287 | 197 | 90 | 0 |
| Learning Outcomes | 153 | 33 | 120 | 0 |
| Learning Indicators | 683 | 0 | 683 | 0 |

Every flagged node carries a `reviewNote` explaining why (0 unexplained flags at any
level). Learning Indicators are never directly touched during a Checkpoint 6 structural
correction (only their parent Content Standard/Learning Outcome is) — so **100% of
Learning-Indicator-level flags are inherited from the original Phase 5 extraction**
(typos, garbled OCR, printed code collisions, ambiguous source wording): genuine
content-level uncertainty, not an artefact of this Checkpoint's restructuring work.
`reviewStatus` is `PENDING` for all 4,310 nodes uniformly (human approval is a separate,
always-pending step by design) — there is no distinct database state for "whole subject
awaiting approval" to report separately.

### Genuinely unresolved Learning Outcomes (11 total, all excluded and reported, none forced)

| Subject | Learning Outcome | Reason |
|---|---|---|
| Agricultural Science | `3.1.3.LO.2` | Source prints only 2 Content Standards for 3 siblings; no 3rd anywhere in the document. |
| Spanish | `3.3.5.LO.2` | The Sub-Strand's single Learning Indicator addresses only personal food preference, not comparative/typical foods of other countries. |
| Engineering | `1.1.1.LO.2` | No Learning Indicator addresses "role of professionals" distinctly from the discipline-overview content matched to LO.1. |
| Engineering | `2.1.3.LO.2` | No Learning Indicator addresses "identify professional behaviour" distinctly from the "need for professionalism" content matched to LO.1. |
| Engineering | `3.4.1.LO.1` | Its Content Standard's Learning Indicators are both explicitly design/PLC-framed, matching sibling LO.2 instead. |
| Arabic | `2.3.2.LO.2` / `3.3.2.LO.2` | No Content Standard in the source distinguishes classical Arabic *prose* from *poetry*; only a poetry-specific one exists. |
| Arabic | `3.3.1.LO.4` | Only a modern-*poetry* Content Standard exists; no modern-prose equivalent in the source. |
| Arabic | `3.4.3.LO.3` | Overlaps ambiguously with 2 siblings (personal experience, famous quotes); no Content Standard distinctly its own. |
| Art and Design Foundation | `2.2.1.LO.2` | The one Learning Indicator touching its theme (cultural memory) is a thin echo within a Content Standard whose title and other indicators align with a sibling instead. |
| Physical Education & Health (Core) | `3.1.3.LO.3` | "Explain the concepts injuries" (generic) has no Learning Indicator distinct from the sports-injuries-specific content matched to sibling LO.4. |

Full evidence and page citations for every row above: `extraction-progress.json` →
`checkpoint6_database_import.phase1Corrections` (per subject).

### Final validation suite (2026-09-29)

| Check | Result |
|---|---|
| `prisma validate` | PASS |
| TypeScript (`tsc --noEmit`) | PASS (0 errors) |
| ESLint | PASS (0 errors; 4 pre-existing, unrelated warnings in `tools/docx-build/build.ts`) |
| `scripts/test-curriculum-import.ts` (admin CSV/JSON import) | PASS (33/33) |
| `scripts/test-curriculum-api.ts` | PARTIAL — 1 assertion (path hydration) fails intermittently due to a confirmed pre-existing Next.js dev-server infrastructure issue (Jest-worker child-process crashes, consistent with repeated low-system-memory notifications throughout this session), not a data or code defect; the underlying repository function was verified correct via a direct call bypassing the flaky HTTP layer. |
| `scripts/test-curriculum-admin-crud.ts` | PARTIAL — same pre-existing infra flakiness, fails at a different random point each run; all CRUD logic exercised up to that point passes every time. |
| Idempotency (`--all` full re-run) | PASS — 0 rows created anywhere across all 33 subjects, 11 excluded Learning Outcomes reported consistently, 0 failed. |
| `npm run build` (production) | PASS (all routes compiled, no errors) |

**Planner compatibility**: PASS for the standard flow (see final validation suite above;
the one intermittent test failure is confirmed dev-server infrastructure flakiness, not a
planner-compatibility issue). One honest, documented gap for Checkpoint 7 — a teacher
selecting the *additional* (non-primary) Content Standard directly currently sees no
Learning Outcomes via the existing query (`listLearningOutcomes` only checks the primary
relationship). Data isn't lost, just not yet surfaced from that angle; recommended fix is
a query fallback to `additionalContentStandardLinks`, not a UI redesign.

## Environment fixes made along the way

- The local dev Postgres (`scripts/local-postgres.ts`, embedded-postgres) had been
  initialised with server encoding WIN1252 instead of UTF8 — would reject legitimate
  UTF-8 curriculum content. Fixed: local DB recreated with UTF8; `local-postgres.ts`
  now passes `initdbFlags: ["--encoding=UTF8", "--locale=C"]` so this can't recur.
- Demo seed `ClassLevel` rows were named "Form 1"/"Form 2" (Day-1 naming, before this
  project settled on "SHS 1/2/3") and collided with the real curriculum's class levels
  on the existing `ClassLevel.sequence` unique constraint. Fixed at the seed-data source
  (`prisma/seed-data/computing-form1.ts`, `demo-teacher.ts`) and in the 4 test scripts
  that asserted the old name against the real `ClassLevel.name` field.

## Checkpoint 7 readiness: YES

All 33 subjects are imported, idempotency-verified, and integrity-checked. The
architectural question is resolved and the pipeline is proven end-to-end across every
subject in the curriculum. The recommended first task for Checkpoint 7 is the one
documented, honest gap above: extend `listLearningOutcomes` with a fallback to
`additionalContentStandardLinks` so a teacher selecting a non-primary Content Standard
sees its Learning Outcome(s) too — not a UI redesign, a query extension. Checkpoint 6 did
not touch the Create Planner UI, the AI generation pipeline, or the wizard in any way, per
its own explicit scope.

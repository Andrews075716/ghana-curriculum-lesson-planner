# Curriculum Relationship Analysis — Structural Resolution Gate

**Status: DECISION APPROVED AND IMPLEMENTED (2026-09-29).** This document was originally
analysis-only (see the original framing below, preserved for the record). The user approved
the hybrid model recommended in §16-17 below; it has since been implemented, migrated
(additively — `prisma/migrations/20260929125322_add_learning_outcome_content_standard_link`),
piloted on `applied-technology`, and verified (idempotent, integrity-checked, query-tested
both directions). Current status, per-subject corrections, and the full remaining-work list:
`data/curriculum/extraction-progress.json` → `checkpoints.checkpoint6_database_import`, and
the human-readable summary in `docs/curriculum-extraction-report.md`. The analysis and
recommendation below remain the accurate record of the evidence and reasoning behind that
decision — nothing below was invalidated by the implementation, only completed.

**Original framing (2026-09-29, before the decision):** No Prisma schema change, no migration, no import of the 21 blocked
subjects, and no modification to the 12 successfully-imported subjects was made while
producing this report. This document exists to support an architectural decision before any
of that happens.

Method note: every finding below is derived from directly parsing the 33 extraction files in
`data/curriculum/` (not from memory or the earlier severity table alone), cross-checked with
targeted spot-reads of the underlying JSON content for representative examples in every tier,
and validated against page/source references already captured in the extraction data. Where a
finding is heuristic (the automated misattribution classifier, described in §3), it is labeled
as such and was manually spot-checked, not trusted blindly.

---

## 1. Executive summary

The 21 blocked subjects are **not** one uniform problem. Analysing all 361 individual
"Learning Outcome has 0 or 2+ Content Standards" anomalies across them and classifying each
one's likely cause produces four distinct patterns, at these proportions:

| Category | Count | % | Meaning |
|---|---|---|---|
| **F — Sibling misattribution** | 141 | 39% | Extraction attached a Content Standard to the wrong sibling Learning Outcome. Fixable by moving it, same as the Geography fix already applied. |
| **A — Missing Content Standard** | 114 | 32% | No Content Standard exists anywhere in the Sub-Strand that plausibly belongs to this Learning Outcome. Genuine gap. |
| **B — Multiple Content Standards** | 60 | 17% | One Learning Outcome genuinely has 2+ distinct Content Standards under it in the source, with no better home for the "extra" one(s). |
| **C — Shared Content Standard** | 46 | 13% | One Content Standard genuinely serves more than one sibling Learning Outcome. |

**The critical finding:** categories B and C point in *opposite* structural directions — B
needs "one Learning Outcome, many Content Standards" (which the *reversed* LO-parent model
would represent natively) and C needs "one Content Standard, many Learning Outcomes" (which
the *current* CS-parent model represents natively). Both are real, both are present in
non-trivial numbers (60 and 46 respectively), and **neither Option A (current) nor Option B
(reversed) can represent both simultaneously without forcing one of them into fabricated or
lossy shape.** This is not primarily a "we picked the wrong parent" problem — it is evidence
that a meaningful slice of the real curriculum corpus has genuine many-to-many-shaped
relationships between Content Standards and Learning Outcomes that a single strict parent
direction cannot express.

The 39% sibling-misattribution slice, however, means a large fraction of the problem **is**
addressable the same way Geography was: careful, evidence-based, human-reviewed correction —
not a schema change. Doing that first, subject by subject, before deciding whether the
remaining genuine-structure cases need a schema change, is the recommended path (§16, §21).

---

## 2. Current successful import state (verified intact)

Re-checked directly against the live database before writing this report:

```
subjects: 12   classLevels: 3   curriculumVersions: 2
strands: 122   subStrands: 277  contentStandards: 345
learningOutcomes: 347   learningIndicators: 962
```

Matches the state reported before this analysis began. Nothing in this analysis touched the
database, the 12 subjects' extraction JSON files, or the Prisma schema.

---

## 3. Analysis of all 21 blocked subjects

For every blocked subject, every Learning Outcome with `contentStandards.length !== 1` was
extracted with full context: its own code/description, every Content Standard nested under
it, and every sibling Learning Outcome in the same Sub-Strand with *its* Content
Standard(s). 361 such records were found across the 21 subjects.

Each record was then auto-classified by a heuristic: for a 0-CS Learning Outcome, search its
siblings' "extra" Content Standards (from 2+-CS siblings) for the best word-overlap match
against its own description; symmetrically for a 2+-CS Learning Outcome, search its 0-CS
siblings. A match above a modest overlap threshold (Jaccard ≥ 0.15 on content words) is
classified **F — Sibling misattribution**; otherwise a 0-CS outcome with multiple 0-CS
siblings sharing few single-CS neighbors is classified **C — Shared Content Standard**; a
2+-CS outcome with no match is **B — Multiple Content Standards**; and a 0-CS outcome with no
match and no sharing pattern is **A — Missing Content Standard**.

This heuristic was spot-checked against real content (not trusted blindly) in `agriculture`,
`manufacturing-engineering`, `engineering`, `arabic`, and `government` — see §5–§7 for the
specific evidence. It correctly separated e.g. Manufacturing Engineering's genuinely distinct
two-Content-Standards-per-outcome pairs ("fundamentals of engineering materials" vs "classify
materials according to their use" — both real, both under one outcome) from Agriculture's
clear misattributions (0.54–0.60 word-overlap scores, near-identical wording split across two
adjacent nodes).

---

## 4. Failure-category counts (structural analysis table)

| Subject | Severity | Total LOs | Total CSs | Total LIs | Blocked LOs | Primary category | Secondary category | Source structure clear? | Can current DB represent it? | Recommended treatment |
|---|---|---|---|---|---|---|---|---|---|---|
| agricultural-science | near-clean | 37 | 36 | 85 | 1 | A (genuine gap) | — | Partially — 2 CS legitimately cover 3 LOs, no clean redistribution | No | Leave blocked; needs editorial judgment, not a mechanical fix |
| art-and-design-studio | near-clean | 26 | 24 | 62 | 2 | C (shared CS) | — | Yes — 1 CS genuinely covers 3 sibling LOs | No (without a link table) | Leave blocked; genuine shared-CS case |
| applied-technology | near-clean | 32 | 33 | 176 | 3 | F (misattribution, 2/3) + B (1/3) | — | Yes, both sub-cases | Partially (1 fixable now) | Fix the 1 clean swap; the Wood-Technology/SHS2 case (1 LO genuinely serving 2 CS, no sibling) stays blocked |
| mathematics | moderate | 41 | 40 | 109 | 5 | A (2) | F (2), B (1) | Mixed | Partially | Case-by-case; not one pattern |
| government | moderate | 21 | 17 | 53 | 4 | A (4/4) | — | Yes — genuine gaps; 3/4 also have malformed codes (missing separator dot) suggesting a table-extraction defect co-occurring with the gap | No | Leave blocked; possible G (table-extraction) contributing cause, needs source PDF re-check |
| design-communication-technology | moderate | 29 | 29 | 89 | 6 | F (6/6, 100%) | — | Yes — same shape 3 times (one LO gets 2 CS, sibling gets 0) | Yes, fully, via swap | Fix all 3 pairs; likely fully importable after |
| art-and-design-foundation | moderate | 31 | 30 | 80 | 8 | F (4) | A (3), B (1) | Mixed | Partially | Fix the 4 misattributions; 4 remain genuine |
| engineering | severe (37%) | 57 | 36 | 102 | 21 | A (19) | C (2) | Yes — already went through one topical-judgment normalization pass in Checkpoint 5; these are the genuine leftovers, not unexamined raw data | No | Leave blocked; already-judged genuine gaps |
| biology | severe (39%) | 38 | 38 | 72 | 15 | F (11) | A (3), B (1) | Mixed | Partially | Fix 11 misattributions; re-assess remainder |
| economics | severe (42%) | 36 | 37 | 86 | 15 | F (6) | B (5), A (4) | Mixed | Partially | Mixed treatment |
| spanish | severe (49%) | 45 | 31 | 47 | 22 | A (11) | B (3), C (6), F (2) | Mixed | Partially | Mixed treatment, mostly genuine gaps |
| additional-mathematics | severe (44%) | 54 | 34 | 162 | 24 | C (16) | A (6), B (2) | Yes — dominant shared-CS pattern (extremely dense Content Standards spanning many Learning Outcomes, already documented in Checkpoint 5 extraction notes) | No | Leave blocked; genuine, already-documented shared structure |
| english-language | severe (51%) | 57 | 46 | 99 | 29 | A (10) | C (7), F (7), B (5) | Mixed | Partially | Mixed treatment |
| literature-in-english | severe (54%) | 41 | 38 | 111 | 22 | F (14) | A (5), B (3) | Mostly misattribution | Partially, likely mostly fixable | Fix 14 misattributions first, reassess |
| agriculture | severe (52%) | 44 | 46 | 117 | 23 | F (21, 91%) | B (1), A (1) | Yes, overwhelmingly misattribution | Yes, mostly | Fix 21 misattributions; likely near-fully importable after |
| physical-education-health-core | severe (56%) | 25 | 18 | 69 | 14 | C (6) | F (5), A (3) | Mixed | Partially | Mixed treatment |
| general-science | severe (58%) | 31 | 30 | 60 | 18 | F (16, 89%) | B (1), A (1) | Yes, overwhelmingly misattribution | Yes, mostly | Fix 16 misattributions; likely near-fully importable after |
| chemistry | severe (65%) | 26 | 24 | 81 | 17 | F (14, 82%) | A (2), B (1) | Yes, overwhelmingly misattribution | Yes, mostly | Fix 14 misattributions; likely near-fully importable after |
| robotics | severe (74%) | 35 | 36 | 64 | 26 | B (9) | A (9), F (8) | Mixed, genuinely 3-way split | No, not without a link table | Leave mostly blocked; genuine mixed structure |
| manufacturing-engineering | severe (77%) | 26 | 41 | 87 | 20 | B (17, 85%) | C (3) | Yes — genuinely multiple distinct Content Standards per outcome throughout | No, not without a link table | Leave blocked; genuine multi-CS-per-LO structure, confirmed by content |
| arabic | severe (74%) | 89 | 74 | 193 | 66 | A (30) | F (23), B (9), C (4) | Mixed | Partially | Mixed treatment, largest remaining subject |

### Aggregate category counts (all 21 subjects)

```
F  Sibling misattribution:     141  (39%)
A  Missing Content Standard:   114  (32%)
B  Multiple Content Standards:  60  (17%)
C  Shared Content Standard:     46  (13%)
D  CS outside any LO:             0  (confirmed absent — see §8)
E  LO outside any CS:            n/a (every LO is inside a Sub-Strand by construction)
G  Table-extraction error:     suspected contributing factor in government (see above), not separately tallied — codes are preserved verbatim per project convention, so a "garbled code" and a "genuine gap" look identical in the JSON and can't be mechanically distinguished from each other without re-reading the source PDF
H  Source structural variation: this IS what categories B and C represent — see §1
I  Ambiguous source:           a subset of category A where no source-page evidence points either way; not separately broken out here, would need PDF re-verification per subject
```

**Answer to the core question in §4 of the task:** the 21 subjects represent a mix of all
three possibilities you asked about — a real (if large, 141-record) slice of extraction
errors, several legitimate alternate curriculum structures (B and C, 106 records, 29%), and
genuine ambiguity/gaps that need source re-verification (A, 114 records, 32%). It is not
dominated by any single one of the three.

---

## 5. Near-clean subject findings

### agricultural-science (1 blocked LO)
Sub-Strand "AGRICULTURAL MACHINERIES" (SHS 3): LO `3.1.3.LO.2` ("Explain the functions of
parts of various machinery provided") has 0 Content Standards. Its two siblings already have
exactly one Content Standard each (`3.1.3.CS.1` on irrigation, matching `3.1.3.LO.1`;
`3.1.3.CS.2` on "machines and computing tools to reduce drudgery," matching `3.1.3.LO.3`'s
near-identical wording). There is no third, unclaimed Content Standard anywhere in this
Sub-Strand to give `LO.2` — only 2 Content Standards exist for 3 Learning Outcomes. **This is
not comparable to the Geography case**: Geography had a Content Standard sitting under the
wrong parent; here there is no candidate Content Standard at all. Recommendation: leave
blocked. Resolving it would require either fabricating a Content Standard (against project
rules) or accepting that `LO.2` has no importable Content Standard in this model.

### art-and-design-studio (2 blocked LOs, same underlying cause)
Sub-Strand "MATERIAL CLASSIFICATIONS AND METHODS" (SHS 1): LOs `1.1.2.LO.1` and `1.1.2.LO.2`
both have 0 Content Standards; sibling `1.1.2.LO.3` has exactly one, `1.1.2.CS.1`
("Demonstrate knowledge and understanding of art and design material classification and
method") — a broad statement that plausibly covers all three outcomes (materials' nature/
method/use; methods for creating 2-D/3-D work; methods for preparing/storing media are all
facets of "material classification and method"). This is a genuine **C — Shared Content
Standard** case: one Content Standard for the whole Sub-Strand, legitimately serving 3
Learning Outcomes. Recommendation: leave blocked under the current strict model; this is
exactly the shape a many-to-many link would represent cleanly (§8).

### applied-technology (3 blocked LOs, two different causes)
- **Woodwork Technology, SHS 1** (fixable): LO `1.5.2.LO.1` has 2 Content Standards; sibling
  `1.5.2.LO.2` has 0. `1.5.2.CS.2` ("Utilisation of Manufactured Boards from Wood Residues")
  matches `LO.2`'s wording ("manufactured boards from Wood and non-wood residues... types and
  uses") much better than `LO.1`'s (timber classification). **This is directly comparable to
  the Geography case** — clear documentary evidence of a one-off misattribution. Proposed
  correction: move `1.5.2.CS.2` to nest under `1.5.2.LO.2`, same technique as Geography.
- **Wood Technology, SHS 2** (not fixable): Sub-Strand "MATERIALS AND ARTEFACT PRODUCTION IN
  WOODWORK INDUSTRY IN GHANA" has exactly **one** Learning Outcome (`1.4.2.LO.1`) with two
  Content Standards (`2.4.2.CS.1` design/making, `2.4.2.CS.2` finishing) — both genuinely
  distinct topics, and there is no sibling Learning Outcome to redistribute to (there is only
  one LO in the whole Sub-Strand). This is a genuine **B — Multiple Content Standards** case.
  Also note: the LO's own code uses a Year-1-style prefix (`1.4.2`) while its Content
  Standards use Year-2-style prefixes (`2.4.2`) despite both being under the SHS-2 wrapper —
  a genuine source-document code inconsistency, not something to silently renumber.

**Not documented and silently corrected** per the task's instruction: only the two clear,
evidenced cases above (Geography, and Woodwork/SHS1) are proposed as corrections; the other
2 near-clean gaps are left blocked with their evidence recorded here.

---

## 6. Moderate subject findings

The four moderate subjects do **not** share one underlying structural pattern:

- **design-communication-technology**: 100% (6/6) sibling misattribution, and strikingly
  uniform — the exact same shape (one LO gets 2 Content Standards, its sibling gets 0) recurs
  identically in three different Sub-Strands (`2.2.2`, `2.3.1`, `2.3.2`). This looks like a
  systematic extraction-agent habit specific to this file, not three unrelated incidents. A
  deterministic rule ("when a Sub-Strand has exactly 2 Learning Outcomes and exactly 2 Content
  Standards both nested under the first one, split them 1:1 by matching wording") would very
  likely resolve all 3 cases safely and could be worth writing as a repeatable check — but
  each of the 3 still deserves the same human-reviewable wording comparison Geography got
  before being applied, not a blind mechanical split.
- **government**: 100% (4/4) genuine gaps (category A), no misattribution pattern at all. 3 of
  the 4 also have malformed codes (`2.1.1.LO1` missing its separator dot, for example) —
  circumstantial evidence that whatever caused the printing defect may also have affected
  whether a Content Standard printed correctly nearby. Recommend a source-PDF re-check for
  this specific subject rather than assuming these are unrecoverable.
- **mathematics** and **art-and-design-foundation**: genuinely mixed, no dominant pattern.

**No single deterministic transformation rule can represent all four.** Design-Communication-
Technology's pattern is regular enough that a targeted rule *could* help there specifically,
but generalizing it to the other three would misfire (government has no misattribution cases
to "split" at all).

---

## 7. Severe subject findings

This is the most important analysis, and the evidence is unambiguous: **the current strict
Content-Standard-parent-of-Learning-Outcome model is genuinely too rigid for a real,
non-trivial slice of this curriculum collection — but not because the whole collection uses a
different model. It's because different subjects (and different Sub-Strands within the same
subject) legitimately use different real cardinalities.**

Concrete evidence, not inference:

- **manufacturing-engineering** (worst case, 77% of LOs affected): 17 of its 20 blocked LOs are
  genuine **B — Multiple Content Standards**, confirmed by reading the actual content — e.g.
  `1.1.1.LO.1` ("Demonstrate understanding of the performance of materials") legitimately has
  two distinct Content Standards, "fundamentals of engineering materials" and "classify
  materials according to their use." No sibling anywhere shares these. This subject's own
  totals (41 Content Standards vs. 26 Learning Outcomes — more standards than outcomes) already
  flagged this shape back in Checkpoint 5; this analysis confirms it directly against content,
  not just counts.
- **additional-mathematics** (44%): dominant category is **C — Shared Content Standard** (16 of
  24), consistent with that file's own extraction notes describing extremely dense Content
  Standards (one spanning ~35 printed pages) that legitimately span multiple Learning Outcomes.
- **agriculture** (52%) and **general-science** (58%) and **chemistry** (65%): the *opposite*
  shape — 82-91% of their blocked LOs are **F — sibling misattribution**, meaning these three
  are much closer to "extraction errors, fixable like Geography" than "genuine alternate
  structure." They should NOT be lumped in with manufacturing-engineering/additional-
  mathematics just because they're both labeled "severe" by raw percentage.
- **robotics** (74%) and **arabic** (74%, the largest remaining subject at 89 Learning
  Outcomes) are the two subjects where all four categories appear in meaningful numbers
  simultaneously — no single treatment (schema change OR misattribution fix) would resolve
  either one alone.

**Severity percentage alone is a poor proxy for "how hard is this to fix."** Two subjects can
have similar percentages for completely different underlying reasons, requiring completely
different treatment.

---

## 8. Verified official curriculum relationship patterns

Structural facts confirmed by parsing every one of the 33 extraction files directly (not the
21 blocked ones — all 33):

- **Content Standard never appears outside a Learning Outcome anywhere in any file** (0
  instances of a Sub-Strand or Strand carrying its own `contentStandards` array — the one
  historical exception, `engineering.json`, was normalized to this shape back in Checkpoint 5
  and stayed that way). Category **D (CONTENT_STANDARD_OUTSIDE_LO) does not occur** in the
  current data.
- **Learning Indicator never appears outside a Content Standard anywhere in any file** (0
  instances of an LI attached directly to a Learning Outcome, Sub-Strand, or Strand).

So the raw extraction shape is, universally: `Sub-Strand → Learning Outcome → Content Standard
→ Learning Indicator`. The open question this whole project has been wrestling with is *not*
"where does each node type attach" (that part is 100% consistent) — it's "which of Learning
Outcome and Content Standard is the semantically correct parent," given the extraction schema
put Learning Outcome outermost while the pre-existing database and architecture doc put
Content Standard outermost.

---

## 9. Is Content-Standard → Learning-Outcome universal?

**No — insufficient on its own for at least 106 of 361 anomalous relationships (B + C
categories, 29%)**, and that's before counting the 114 genuine-gap (A) cases, some fraction of
which are likely also mis-modeled rather than genuinely absent. It IS sufficient for the 12
already-imported subjects and (after the documented fixes) will be sufficient for Geography,
the Woodwork/SHS1 half of applied-technology, and likely most of design-communication-
technology, agriculture, general-science, and chemistry once their misattributions are
corrected — probably in the range of 16-20 of 33 subjects total once the F-category fixes are
done. It is fundamentally insufficient for manufacturing-engineering, additional-mathematics,
art-and-design-studio, robotics, and arabic without either data loss or a schema change.

## 10. Is Learning-Outcome → Content-Standard universal?

**No, symmetrically insufficient**, for the mirror-image reason: it would represent the 60
"B" cases (multiple Content Standards per outcome) natively, but would break the 46 "C" cases
(one Content Standard shared by multiple outcomes) exactly as badly as the current model
breaks the B cases. Flipping the parent direction does not reduce the total problem — it
relocates it. Concretely: manufacturing-engineering (dominated by B) would become fully clean
under this model, but art-and-design-studio and additional-mathematics (dominated by C) would
become newly broken. Net difference across all 21 subjects is a wash, not an improvement — and
it would come at the cost of breaking the 12 subjects and the admin CRUD feature that already
correctly assume Content-Standard-as-parent.

## 11. Is Learning-Outcome → Learning-Indicator universal?

**Yes, confirmed with no exceptions across all 33 files.** Every Learning Indicator in the
extracted data is nested under a Content Standard (never directly under a Learning Outcome,
Sub-Strand, or Strand) — but reading the actual indicator text confirms Learning Indicators
are consistently granular, specific, individually-assessable actions ("Identify...", "Explain
...", "Compare...") that support their *immediate* Learning Outcome's broader, single
assessable statement — not the even-broader Content Standard statement above it. This matches
the existing database schema exactly (`LearningIndicator.learningOutcomeId`, no direct
Content-Standard link) and matches standard NaCCA curriculum semantics. **No change needed
here** — this part of the schema was already correct, and the extraction files' habit of
nesting Learning Indicators under whichever node they called "Content Standard" is simply a
byproduct of the same inverted mental model that caused the CS/LO swap, not a separate real
structural finding.

## 12. Are many-to-many relationships required?

**Partially — not a blanket "every subject needs M:N," but yes for a specific, identifiable
subset.** The evidence:
- True 1-Content-Standard-to-many-Learning-Outcomes exists and is confirmed by content
  (art-and-design-studio, additional-mathematics, parts of robotics/PE-core/english-language).
- True 1-Learning-Outcome-to-many-Content-Standards exists and is confirmed by content
  (manufacturing-engineering, parts of robotics/economics/spanish).
- No confirmed instance was found of a genuine many-to-many (one Content Standard serving
  several Learning Outcomes AND at least one of those same Learning Outcomes also having
  another, different Content Standard) — the patterns found are 1:N and N:1 in different
  places, not M:N in the same place. A junction/link table would still be the correct way to
  represent this without having to distinguish "1:N here, N:1 there, strict 1:1 everywhere
  else" as three different code paths — but it does not need to support arbitrary M:N on day
  one to cover the evidence actually found.

## 13. Comparison of database Options A, B and C

**Option A — current strict hierarchy (Content Standard → Learning Outcome → Learning
Indicator).** Already representing 12 subjects cleanly plus Geography (fixed). Likely
extensible, via the same misattribution-correction technique, to roughly 16-20 of 33 subjects
without any schema change — see §9. Cannot represent the remaining ~13-17 subjects without
either accepting incomplete data (skip the genuinely-B/C nodes) or fabricating structure.

**Option B — reversed strict hierarchy (Learning Outcome → Content Standard → Learning
Indicator).** Would represent a *different*, not larger, set of subjects cleanly (§10) — the
ones currently dominated by category B instead of category C. Requires reversing the 12
already-imported subjects (all currently clean 1:1, so this is possible without breaking them,
but pointless — there's no gain), reversing the existing admin CRUD/CSV-import feature, and
contradicts the original architecture doc and the planner wizard's existing UI order. **Not
recommended**: no net improvement in coverage, real cost in rework and risk to working
features.

**Option C — flexible relational model (explicit relationships, junction table where
justified).** Can represent all 33 subjects faithfully, including every B and C case found,
without forcing any node into an incorrect parent and without fabricating or dropping data.
Cost: a real (though additive, see §17) schema and importer change, and it changes how "the
curriculum tree" is queried — see §15 for how this is kept invisible to teachers.

---

## 14. Impact on existing imported data

None of the three options requires touching the 12 imported subjects' data. Option A needs no
change to them at all (they're already correctly shaped). Option C's proposed shape (§17) is
purely additive — the 12 subjects' existing rows stay exactly as they are; a Learning Outcome
that already has exactly one Content Standard doesn't need a junction-table row at all under
the recommended design (the direct FK stays primary; the junction table only holds the *extra*
relationships that don't fit the primary tree). Demo Computing records, `LessonPlanner` data,
`TeacherProfile`/`User` data, and all review/approval-status columns added in the last
migration are unaffected by any of the three options — none of them touch those tables.

## 15. Impact on Create Planner

The teacher-facing flow (Subject → Class/Form → Strand → Sub-Strand → curriculum requirement)
does not need to expose any of this complexity. Under Option C, after a teacher selects a
Sub-Strand, the app can present "the officially related Content Standards, Learning Outcomes,
and Learning Indicators for this Sub-Strand" as a flat, grouped list — using the *primary*
required relationship for the common 1:1 case (the vast majority of nodes) and the
supplementary junction-table data only to also surface the genuine extra links, without
presenting any of it as a strict parent-child tree the curriculum itself doesn't support. This
is strictly additive to the UI, not a redesign — no change to `curriculum.repository.ts`'s
existing query shape is required for the subjects that don't need it (the 12 imported + any
future 1:1-clean subject keep working exactly as today).

---

## 16. Recommended canonical curriculum model

**Keep Content Standard as the primary, required parent of Learning Outcome (Option A stays
canonical)** — it matches the original architecture, the planner wizard's existing UI, the
admin CRUD feature, standard NaCCA convention, and already correctly represents the 12
imported subjects plus Geography. **Add an optional, additive many-to-many link table**
(§12-13, Option C) to record the genuine extra relationships (B and C cases) that the primary
tree can't express, without weakening or requiring changes to the primary relationship. This
is a hybrid of Option A (kept canonical, zero risk to existing data) and Option C (added
capability, zero cost to subjects that don't need it).

Concretely, for every blocked subject going forward:
1. First, run the same evidence-based misattribution review Geography got (§5-7 show this
   alone resolves roughly 39% of all anomalies, concentrated heavily in agriculture,
   general-science, chemistry, design-communication-technology, and literature-in-english).
2. For what's left after that — genuine B/C cases — pick one Content Standard as the primary
   (required) parent using the same topical-judgment approach already used for `engineering.
   json` in Checkpoint 5, and record every additional genuine relationship in the new junction
   table rather than discarding it.
3. Subjects where even step 2 can't produce a confident answer (the § "I — Ambiguous source"
   cases) stay blocked pending source-PDF re-verification, exactly as today — no subject gets
   forced through fabrication.

## 17. Proposed Prisma changes, if required (NOT executed)

Purely additive, in the same spirit as the Checkpoint 6 migration already applied:

```prisma
/// Additional, non-primary Content-Standard <-> Learning-Outcome relationships that the
/// primary tree (ContentStandard.learningOutcomes / LearningOutcome.contentStandardId)
/// can't express because the source curriculum genuinely relates one Content Standard to
/// more than one Learning Outcome, or vice versa. The primary FK always holds one confirmed
/// relationship (chosen by the same topical-judgment review used for every other manual
/// correction in this project); this table holds the rest, so no relationship found in the
/// source is ever silently dropped.
model LearningOutcomeContentStandardLink {
  id                String   @id @default(cuid())
  learningOutcomeId String   @map("learning_outcome_id")
  contentStandardId String   @map("content_standard_id")
  /// Free-text justification for why this link exists, e.g. "source Sub-Strand X prints
  /// this Content Standard once, covering 3 sibling Learning Outcomes."
  note              String?  @db.Text
  createdAt         DateTime @default(now()) @map("created_at")

  learningOutcome  LearningOutcome  @relation(fields: [learningOutcomeId], references: [id], onDelete: Cascade)
  contentStandard  ContentStandard  @relation(fields: [contentStandardId], references: [id], onDelete: Cascade)

  @@unique([learningOutcomeId, contentStandardId])
  @@map("learning_outcome_content_standard_links")
}
```

No change to any existing column, table, or constraint. No `DROP` of anything. Adds one table
and its two inverse relation fields on `LearningOutcome`/`ContentStandard`.

## 18. Migration strategy (described, not executed)

1. Write the additive migration above (new table only).
2. Apply via the same `prisma migrate deploy` non-interactive path already used successfully
   for the Checkpoint 6 migration.
3. Verify the 12 existing subjects' row counts and relationships are unchanged (same
   verification pattern as before).
4. No backfill needed for the 12 existing subjects or Geography — none of them have a genuine
   B/C relationship, so the new table starts empty.

## 19. Importer changes (described, not executed)

`extraction-importer.ts`'s current all-or-nothing safety gate (`findAmbiguousSubStrand`) would
change from "any 0-or-2+-CS Learning Outcome blocks the whole subject" to a two-pass model:
first pass applies the reviewed, evidence-based corrections (misattribution swaps, documented
per-subject like the Geography fix); second pass, for whatever remains, picks a primary
Content Standard per Learning Outcome and writes any additional genuine relationships to the
new link table instead of blocking. A subject would only still be fully skipped if a Learning
Outcome has zero Content Standards *and* no reviewed correction was made for it (the
category-A "genuine gap" and unresolved category-I "ambiguous" cases) — meaning partial import
of an otherwise-mostly-clean subject becomes possible, with the specific still-unresolved
nodes flagged `NEEDS_REVIEW` and simply absent rather than blocking their whole subject.

## 20. Risks

- **Reviewer time**: the misattribution-correction step is manual, evidence-based, per-subject
  work (like Geography) — 141 records is a real amount of careful reading, even concentrated
  in a handful of subjects.
- **Partial-import subjects**: once the importer can partially import a subject (§19), a
  subject's imported totals may not exactly match its source document's totals (some Learning
  Outcomes' Content Standards may remain unresolved). This must be surfaced clearly (it already
  is, via `NEEDS_REVIEW`) so nobody mistakes a partial import for a complete one.
- **Junction table adds a second place to look**: any future query or AI-context-assembly code
  that only reads the primary tree will miss the supplementary relationships. This needs to be
  a documented, deliberate design decision (§15's recommendation — most consumers only need the
  primary tree; only a few need the full picture), not something that gets silently forgotten.
- **The heuristic classification in this report is not perfect.** It was spot-checked, not
  exhaustively verified against every one of the 361 records. Before actually applying any
  correction to a subject's JSON, that subject's specific anomalies should get the same
  individual verification Geography and the Woodwork/SHS1 case got here — this report
  identifies *where* to look and *what pattern to expect*, not a ready-to-apply patch set.

## 21. Recommendation for completing Checkpoint 6

1. Get your decision on the canonical model (§16) and the junction-table approach (§17) before
   anything else.
2. Once approved: apply the additive migration (§17-18), update the importer (§19).
3. Work through the F-category-dominant subjects first (agriculture, general-science,
   chemistry, design-communication-technology, literature-in-english, and the Woodwork/SHS1
   half of applied-technology) — same evidence-based, human-reviewed technique as Geography,
   likely the fastest path to visibly shrinking the blocked count.
4. Then work through the B/C-dominant subjects (manufacturing-engineering, additional-
   mathematics, art-and-design-studio, robotics) using the junction table once it exists.
5. Subjects with a large genuine-gap (A) share (government, engineering, arabic) likely need a
   source-PDF re-verification pass rather than a JSON-only fix — flag these for that
   separately rather than expecting the same technique to resolve them.

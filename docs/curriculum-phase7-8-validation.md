# Phase 7 — Representative Sample & Phase 8 — Validation

## Phase 7: what was extracted and why these 5 subjects

Five structurally distinct subjects were chosen to exercise every major structural
finding from the full Phase 1 inventory, not just the "easy" reference case:

| Sample file | Subject | Why chosen |
|---|---|---|
| `data/curriculum/samples/physics.sample.json` | Physics | Reference subject — standard SHS science pattern (Strand → Sub-Strand → CS → LO → LI → Assessment, 1:1 CS:LO, globally-unique codes) |
| `data/curriculum/samples/applied-technology.sample.json` | Applied Technology | Exercises the new `pathway` field — Years 2–3 branch into 3 mutually exclusive named options |
| `data/curriculum/samples/physical-education-health-core.sample.json` | Physical Education & Health (Core) | Exercises a subject with only **one Strand** for the entire three-year curriculum |
| `data/curriculum/samples/agricultural-science.sample.json` | Agricultural Science | Exercises the **non-globally-unique code** finding — Learning Indicator/Assessment numbering restarts per Content Standard |
| `data/curriculum/samples/french.sample.json` | French | Exercises **non-English content** and UTF-8 round-tripping |

Every field in every sample was copied verbatim from the corresponding
`docs/inventory-parts/<subject>.md` file's "Representative verbatim sample"
section, which was itself read directly from the source PDF earlier in this same
session. **Nothing in any sample was invented.** Where a field wasn't present in
the inventory file's sample (e.g. a Content Standard table that fell outside the
originally-sampled page range), the JSON explicitly says so in a `*Note` field
rather than fabricating plausible-looking content — this is deliberate, matching
the task's "do not silently fill missing fields" rule.

## Phase 8: validation results

### Missing hierarchy levels
- **Applied Technology** and **French** samples deliberately have empty
  `contentStandards: []` arrays with an accompanying `*Note` field explaining why
  (the CS/LI/Assessment table wasn't in the sampled page range for that specific
  Learning Outcome) — this is an honestly-incomplete sample, not a hierarchy break.
  **Flagged `NEEDS_REVIEW`-equivalent for full extraction**: before these two
  subjects are fully imported, their CS/LI/Assessment tables must actually be read.
- **Physics, PE Core, Agricultural Science** samples have the full hierarchy down
  to Learning Indicator/Assessment. No missing levels.

### Duplicate curriculum codes
- **Confirmed and captured, not hidden**: the Agricultural Science sample contains
  two different Learning Indicator records both printed as `1.1.1.LI.1` (one under
  Content Standard `1.1.1.CS.1`, one under `1.1.1.CS.2`), and two Assessment
  records both printed as `1.1.1.AS.1`. Each is explicitly annotated with a
  `codeCollisionWith`/`codeDuplicationNote` field, and the second occurrence is
  marked `reviewStatus: "NEEDS_REVIEW"` with a `reviewNote` explaining exactly why
  (the printed code isn't a safe global uniqueness key; the real natural key must
  include the parent Content Standard's own sequence). **This is the single most
  important validation finding from Phase 7–8**: it confirms the Prisma schema's
  current `LearningIndicator.code @unique` constraint (global, across the whole
  database) would silently reject or corrupt this subject's data on import unless
  the extractor's stored `code` string is disambiguated first (e.g.
  `1.1.1.CS.2.LI.1` instead of the bare printed `1.1.1.LI.1`) — a concrete,
  test-case-backed requirement for Phase 12, not a theoretical concern.
- No other sample shows a code collision.

### Duplicate records
- None found — every record in every sample corresponds to a distinct source
  passage; the Agricultural Science duplication above is a *code* collision, not
  a duplicate *record* (the two Learning Indicators have different `description`
  text, confirming they are genuinely two different curriculum statements that
  happen to share a printed code, not the same statement extracted twice).

### Broken parent-child relationships
- All 5 samples' parent-child nesting was checked against the inventory files'
  verbatim text and confirmed correct (each Learning Indicator sits under the
  Content Standard whose table cell it was printed in; each Learning Outcome sits
  under the Sub-Strand its table header named). No breaks found.

### Truncated text
- The Physics sample's `sel` field is explicitly marked with "[continues on next
  page, not fully sampled]" — this is an honest truncation marker inherited from
  the original inventory file (the physics.md sample itself was cut off at a page
  boundary during Phase 1 sampling), not a silent truncation. **Flagged for full
  extraction**: this specific passage needs re-reading from the next page before
  final import.
- No other sample shows truncated text (each ends at a natural sentence/list
  boundary matching the source).

### Incorrectly joined table cells
- None found in these 5 samples — but this is a known risk flagged in multiple
  Phase 1 inventory files (e.g. Biology, Additional Mathematics, Manufacturing
  Engineering all flagged their Scope-and-Sequence *summary tables* as
  unreliable in raw-text extraction). None of those specific unreliable tables
  were included in these 5 representative samples, so this check passes for the
  sample but remains an open risk for full extraction of those specific subjects'
  summary tables (not their main CS/LO/LI content tables, which extracted cleanly
  in every subject sampled).

### Incorrect page boundaries
- Every `source.page` value in every sample matches the printed page-footer
  number quoted in the corresponding inventory file's verbatim sample section —
  cross-checked directly, not assumed. `pdfPageIndex` is left `null` in most
  samples because the exact raw PDF page index wasn't independently re-derived
  during this sampling pass (only the printed footer number was captured) — this
  is recorded as a real gap, not silently guessed.

### Extraction artefacts
- Confirmed present but correctly excluded from the samples: the corrupted-glyph
  artefact (`'^Z/Z ^ZZZZ>`) seen in Computing and PE Elective, and the
  cover-page title-interleaving artefact seen in nearly every subject, are both
  documented in `docs/curriculum-source-inventory.md` as document-level
  artefacts to filter, and neither appears in any of these 5 content samples
  (they occur in front-matter/cover pages, not in the Strand/Sub-Strand content
  tables sampled here).

### Conflicting curriculum versions
- All 5 samples use the same `curriculumVersion.name: "NaCCA SHS September 2023"`
  — no version conflict within this sample set. (Whether every one of the 33
  documents is actually dated September 2023 on its own cover, as opposed to
  inferred from the shared template, remains an open item for full extraction —
  see the "Extraction feasibility summary" in `docs/curriculum-source-inventory.md`.)

### Suspiciously missing fields
- The PE Core sample's `sel` field is `null` with a `selNote` explaining it wasn't
  present in the sampled Learning Outcome block (SEL guidance may exist elsewhere
  in that Sub-Strand, just not in the one paragraph sampled) — flagged honestly
  rather than either fabricating SEL text or silently omitting the field.

## Conclusion

The representative sample is internally consistent: every record traces to a
real source passage with a page reference, the one genuine structural risk found
(Agricultural Science's non-unique codes) is captured with enough detail to fix
the import pipeline correctly rather than discovered later as a production bug,
and no fabricated or silently-corrected content exists anywhere in the 5 samples.
**This clears the schema and sample for Phase 9 (full extraction)** — with the
explicit condition that the Agricultural Science code-disambiguation rule and the
"read the actual CS/LI/Assessment tables for Applied Technology, Design and
Communication Technology, French, and Agriculture" gap (all flagged above and in
the Phase 1 inventory files) are addressed during full extraction, not deferred
further.

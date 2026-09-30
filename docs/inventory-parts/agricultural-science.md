# AGRICULTURAL SCIENCE CURRICULUM FOR SECONDARY EDUCATION (SHS 1-3)

- **Source file:** curriculum-sources/Agricultural-Science-Curriculum.pdf
- **Subject:** Agricultural Science
- **Level/Form/Class coverage:** SHS 1-3 ("YEAR ONE", "YEAR TWO", "YEAR THREE")
- **Issuing authority:** National Council for Curriculum and Assessment (NaCCA), Ministry of Education, Republic of Ghana; Ghana Education Service also credited
- **Publication year/version:** September 2023
- **Document format:** PDF
- **Page count:** 98 (raw PDF page/form-feed count); printed footer reaches "AGRICULTURAL SCIENCE | 24" and beyond in the sampled range
- **Apparent structure (hierarchy levels, in order, exact terminology):** Same overall pattern as Physics/Robotics/Chemistry/Computing —
  1. **Strand** — note the punctuation differs here: "STRAND 1: NEW DAWN IN AGRICULTURE" (colon, not period, unlike "STRAND 1. MECHANICS AND MATTER" in Physics)
  2. **Sub-Strand** (e.g. "SUB-STRAND 1: MISCONCEPTIONS AND PROSPECTS IN AGRICULTURE AND FARMING")
  3. **Content Standards** (e.g. "1.1.1.CS.1", "1.1.1.CS.2" — multiple Content Standards under one Sub-Strand, confirmed)
  4. **Learning Outcomes** (e.g. "1.1.1.LO.1", "1.1.1.LO.2"), separate table paired with "21st Century Skills and Competencies" and "GESI, SEL and Shared National Values"
  5. **Learning Indicators**, co-located with Pedagogical Exemplars
  6. **Assessment**, DoK Levels 1-4
  - **Structural difference from Physics/Chemistry/Computing:** the "Teaching and Learning Resources" block is NOT only a single block at the end of a Sub-Strand — it appears repeated inside the Content Standard/Learning Indicator table itself, once per Content Standard (confirmed: both `1.1.1.CS.1` and the following `1.1.1.CS.2` blocks each carry their own "Teaching and Learning Resources" list, e.g. "Pictures / Computer / Projector / Smartphones").
  - **Another structural difference:** Learning Indicator and Assessment numbering **restarts at `.1` for each Content Standard** rather than continuing sequentially across the whole Sub-Strand (confirmed: `1.1.1.CS.2` is immediately followed by its own `1.1.1.LI.1`/`1.1.1.AS.1`, not a continuation like `LI.3`/`AS.3`). This means the curriculum code alone is **not globally unique** within a Sub-Strand — code uniqueness in this document is only guaranteed at `{Year}.{Strand}.{SubStrand}.{ContentStandard}.{Type}.{Seq}` granularity, i.e. the Content Standard's own position must be part of the natural key, not just Year/Strand/SubStrand. This is a material finding for the canonical schema/import validator, which currently assumes codes are unique per document.
- **Curriculum code format:** `{Year}.{Strand}.{SubStrand}.{Type}.{Seq}`, e.g. `1.1.1.LO.1`, `1.1.1.CS.1`, `1.1.1.LI.1`, `1.1.1.AS.1` — same visible scheme as other subjects, but see the numbering-restart caveat above; the code as printed does **not** disambiguate which Content Standard a given `LI.1`/`AS.1` belongs to without positional context.
- **Category B elements present:**
  - [x] Exemplars — "Learning Indicators and Pedagogical Exemplars with 21st Century and GESI" header (same as other subjects)
  - [x] Core Competencies — folded into "21st Century Skills and Competencies" (e.g. "Digital Literacy, Communication and Collaborative Skills", "Critical Thinking")
  - [x] Values — "GESI¹, SEL² and Shared National Values"; "National core values:" bullet list (lowercase "core values", matching Computing's convention rather than Chemistry's capitalised "National Core Values" — confirms terminology is NOT standardised across subjects)
  - [x] Pedagogical guidance — named pedagogies (e.g. "Initiating Talk for Learning:", "Think Pair and Share:", "Structuring Talk for Learning:", "Experiential Learning:")
  - [x] Assessment guidance — DoK Levels 1-4, same wording as other subjects
  - [x] Teaching and Learning Resources (TLR) — exact header "Teaching and Learning Resources"; confirmed to repeat per-Content-Standard here rather than once per Sub-Strand (see structural note above)
  - [x] Suggested Activities — embedded bullets under named pedagogies
  - [x] Cross-Cutting Themes — generic front-matter references only
  - [x] GESI / [x] SEL / [x] National Values / [x] 21st Century Skills — all present
- **Extraction feasibility:** COMPLETE — native PDF text layer, extracted via `pdftotext -layout` page-range flags. The Scope and Sequence table (page 21) extracts with significant column misalignment in raw text (numbers run together, e.g. "33 11 11 26 11 12 26") — the overall SHS 1-3 totals line at the bottom (Content Standards 36, Learning Outcomes 37, Learning Indicators 85) is reliably readable, but the per-Sub-Strand breakdown numbers in that table should be re-verified against the rendered PDF, not trusted from raw-text extraction alone.
- **Notes on anything unusual or differing from other subjects:**
  - The Content Standard numbering restart described above is the most significant structural finding for extraction/import design in this subject so far — the extraction pipeline and the `LearningIndicator.code`/`ContentStandard.code` uniqueness assumption in the current Prisma schema (both globally unique `code` columns) will need re-checking against the FULL document (only a 3-page sample was read) to confirm whether codes are actually duplicated across different Content Standards within the same Sub-Strand, which would violate the database's unique constraint on `code` as currently designed.
  - Front-matter "Contextual Issues" section (page 19) is Agriculture-specific (misconceptions that farming is "for poor, unlettered, rural people", gender bias, land tenure issues, climate risk) — same pattern of subject-specific contextual framing seen in Arabic and Chemistry.
  - Same shared cover-page/front-matter template corruption pattern expected (not independently re-verified for this file, but present in every other subject sampled so far using the same corrupted "PHYSICAL AND HEALTH EDUCATION...BASIC 7-10" leftover title fragment).

## Representative verbatim sample

Source: page 23 (printed footer "AGRICULTURAL SCIENCE | 23")

```
Subject       AGRICULTURAL SCIENCE
Strand 1      NEW DAWN IN AGRICULTURE
Sub-Strand 1  MISCONCEPTIONS AND PROSPECTS IN AGRICULTURE AND FARMING

Learning Outcomes        21St Century Skills and Competencies                              GESI1, SEL2 and Shared National Values
1.1.1.LO.1
Explain the importance of    Digital Literacy, Communication and Collaborative Skills:         GESI: Embrace diversity in agriculture, and
agriculture and address      Acquired and or enhanced as they watch videos and communicate.    encourage inclusion and allow learners to question
misconceptions about the                                                                       their stereotypes and biases to clear the
sector                       Critical Thinking: Learners compare evidence on successful        misconceptions.
                             farming enterprises and reflect on their misconceptions.
                                                                                                National core values:
                                                                                                 Respect
                                                                                                 Tolerance
                                                                                                 Resourcefulness
```

(Content Standard / Learning Indicator / Assessment / TLR block, same Sub-Strand, printed page "AGRICULTURAL SCIENCE | 23"-"24")

```
Content Standards          Learning Indicators and Pedagogical Exemplars with 21st Century and GESI                          Assessment
1.1.1.CS.1                 1.1.1.LI.1                                                                                   1.1.1.AS.1
Demonstrate knowledge      Meaning and Importance of Agriculture                                                        Level 1 Recall
and understanding of the                                                                                                Level 2 Skills of
meaning and importance of  Initiating Talk for Learning: Learners review the meaning of Agriculture in mixed ability    conceptual
Agriculture                groups.                                                                                      understanding
                                                                                                                        Level 3 Strategic reasoning
1.1.1.CS.2                 Think Pair and Share: In mixed ability groups, learners discuss the importance of            Level 4 Extended critical
Demonstrate knowledge      Agriculture to society.                                                                      thinking and reasoning
and understanding of the
meaning and importance of  Structuring Talk for Learning: In gender-based groups, learners make a presentation on       1.1.1.AS.2
Agriculture.               the importance of Agriculture in a plenary session.
                           1.1.1.LI.2
Teaching and Learning      Identify and address misconceptions about agriculture and farming at the
Resources                  community and national levels
                            Pictures                                     Computer
                            Projector                                    Smartphones.
```

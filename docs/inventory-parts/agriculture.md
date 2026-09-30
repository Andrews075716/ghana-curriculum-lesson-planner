# AGRICULTURE CURRICULUM FOR SECONDARY EDUCATION (SHS 1-3)

- **Source file:** curriculum-sources/Agriculture-Curriculum.pdf
- **Subject:** Agriculture
- **Level/Form/Class coverage:** SHS 1-3 ("YEAR ONE", "YEAR TWO", "YEAR THREE")
- **Issuing authority:** National Council for Curriculum and Assessment (NaCCA), Ministry of Education, Republic of Ghana; Ghana Education Service also credited
- **Publication year/version:** September 2023
- **Document format:** PDF
- **Page count:** 212 (raw PDF page/form-feed count) — this is a distinctly larger, separate curriculum from "Agricultural Science" (98 pages), confirmed by its own Table of Contents (different Strand names: "Concept of Agriculture in an Industrializing Society", "Modern Technical and Mechanised Agriculture", "Food Production and Natural Resource Conservation", "Agriculture and Health", "Agriculture Economics, Agribusiness and Communication" — 5 strands total vs. Agricultural Science's 4). This is very likely the SHTS/TVET-track version of the subject, distinct from the STEM-track "Agricultural Science" curriculum — **not a duplicate document**, both are genuinely different official curricula and must be imported as separate `Subject` records.
- **Apparent structure (hierarchy levels, in order, exact terminology):** Same pattern as Agricultural Science —
  1. **Strand** (e.g. "Strand 1 CONCEPT OF AGRICULTURE AND INDUSTRIALIZING SOCIETY", printed with a period in the TOC as "STRAND 1." but a bare "Strand 1" in-body, without consistent punctuation)
  2. **Sub-Strand** (e.g. "Sub-Strand 1 AGRICULTURE AND SOCIETY")
  3. **Content Standards**
  4. **Learning Outcomes** (e.g. "1.1.1.LO.1", "1.1.1.LO.2"), in a table paired with "21st Century Skills and Competencies" and "GESI, SEL and Shared National Values"
  5. **Learning Indicators**
  6. **Assessment**, DoK-levelled (not independently re-confirmed for this specific document in the sampled pages, but present in the Scope and Sequence CS/LO/LI count table, matching every other subject's pattern; the CS/LI/Assessment table itself fell just outside the 3-call sampling budget for this document and was not directly read — flagged here rather than guessed at)
- **Curriculum code format:** `{Year}.{Strand}.{SubStrand}.{Type}.{Seq}`, e.g. `1.1.1.LO.1` — same scheme as other subjects.
- **Category B elements present:**
  - [x] Core Competencies — folded into "21st Century Skills and Competencies" (e.g. "Communication, collaboration, creativity and critical thinking skills", "Digital literacy skills")
  - [x] Values — "GESI¹, SEL² and Shared National Values" header; body text uses **"National Values:"** (not "National Core Values:" as in Chemistry, nor lowercase "National core values:" as in Computing/Agricultural Science) — a third distinct wording variant for the same concept, confirming this label is genuinely inconsistent across the NaCCA document set and must not be hard-coded as one canonical string during extraction.
  - [x] GESI / [x] SEL — both present with the same footnote convention ("GESI¹" / "SEL²") as Chemistry/Computing/Agricultural Science
  - [x] 21st Century Skills — present
  - [ ] Exemplars / Pedagogical guidance / Assessment guidance / Teaching and Learning Resources / Suggested Activities — **not independently confirmed** for this document; the CS/LI/Assessment/TLR table (which carries these in every other subject sampled) was not reached within the 3-call sampling budget. Expected present by pattern consistency, but this should not be treated as confirmed until a deeper read is done during full extraction.
  - [x] Cross-Cutting Themes — generic front-matter references only, consistent with other subjects
- **Extraction feasibility:** COMPLETE for the sampled pages (native PDF text layer, no corruption observed), but this inventory is based on a **smaller sample than usual** relative to the document's size (212 pages) — only front matter, the Scope and Sequence table, and the very first Learning Outcome block were read. A subject this size (5 Strands × 3 Years) will need a wider sample before full extraction to confirm the Content Standard/Learning Indicator/Assessment table structure and TLR placement seen in other subjects actually holds throughout.
- **Notes on anything unusual or differing from other subjects:**
  - Scope and Sequence (page 22) gives overall SHS 1-3 totals: **46 Content Standards, 46 Learning Outcomes, 118 Learning Indicators** — the largest indicator count of any subject inventoried so far except Arabic (193).
  - Confirms (together with Agricultural Science) that NaCCA publishes genuinely parallel-but-distinct curricula for the same broad subject area across different SHS tracks (general/STEM vs. SHTS/technical) — the extraction pipeline must treat "Agriculture" and "Agricultural Science" as two separate `Subject` entities, never merged or deduplicated against each other despite the similar name.

## Representative verbatim sample

Source: page 23-24 (printed footer "AGRICULTURE | 23" / "AGRICULTURE | 24")

```
Subject       AGRICULTURE
Strand 1      CONCEPT OF AGRICULTURE AND INDUSTRIALIZING SOCIETY
Sub-Strand 1  AGRICULTURE AND SOCIETY

Learning Outcomes                        21st Century Skills and Competencies                     GESI1, SEL2 and Shared National Values
1.1.1.LO.1
Use the knowledge of the concepts        Communication, collaboration, creativity and             GESI: Learners having experienced a teaching method
in Agriculture to identify the career    critical thinking skills will be required for and        that ensures Gender Equality and Social Inclusion and
opportunities and to clear               acquired from group discussion and presentation.         working with each other in an inclusive way, cross-
misconceptions about Agriculture.                                                                 sharing of knowledge and understanding among groups
                                                                                                  and individuals will lead them to:
                                         Digital literacy skills for surfing the internet for      Respect individuals of different backgrounds.
                                         information on importance of Agriculture.                 Embrace diversity and practice inclusion.

1.1.1.LO.2                              Communication and collaboration are acquired as          National Values:
Use the knowledge acquired in           learners work in groups and make presentations.           Respect of divergent views, tolerance in working in
Agriculture education for further                                                                    groups, resourcefulness in sourcing information and
studies, world of work and adult life.  Digital literacy: skills acquired as learners surf the       self-confidence in self-expression of ideas will be
                                        internet for information.                                    promoted.
```

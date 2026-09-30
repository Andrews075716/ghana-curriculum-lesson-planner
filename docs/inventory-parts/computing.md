# COMPUTING CURRICULUM FOR SECONDARY EDUCATION (SHS 1-3)

- **Source file:** curriculum-sources/Computing-Curriculum.pdf
- **Subject:** Computing
- **Level/Form/Class coverage:** SHS 1-3 ("YEAR ONE", "YEAR TWO", "YEAR THREE")
- **Issuing authority:** National Council for Curriculum and Assessment (NaCCA), Ministry of Education, Republic of Ghana; Ghana Education Service also credited
- **Publication year/version:** September 2023
- **Document format:** PDF
- **Page count:** 103 (raw PDF page/form-feed count); printed footer reaches at least "COMPUTING | 101" near the end of the sampled range
- **Apparent structure (hierarchy levels, in order, exact terminology):** Same pattern as Physics/Robotics/Chemistry —
  1. **Strand** (e.g. "STRAND 1 COMPUTER ARCHITECTURE AND ORGANISATION")
  2. **Sub-Strand** (e.g. "SUB-STRAND 1 DATA STORAGE AND MANIPULATION")
  3. **Content Standards** table, paired with Learning Indicators/Pedagogical Exemplars and Assessment
  4. **Learning Outcomes** (e.g. "1.1.1.LO.1"), separate table paired with "21st Century Skills and Competencies" and "GESI, SEL and Shared National Values"
  5. **Learning Indicators**, co-located with Pedagogical Exemplars
  6. **Assessment**, DoK Levels 1-4, one per Learning Indicator
  - "Teaching and Learning Resources" block confirmed (page 101).
  - **Important cross-check:** this document's own strand/sub-strand names ("Computer Architecture and Organisation" > "Data Storage and Manipulation") exactly match the example given in `docs/04-curriculum-architecture.md` and the names used by the app's existing demo seed data (`prisma/seed-data/computing-form1.ts`) — confirming the current seeded demo data is a hand-transcribed subset of this same official document, not independently invented content.
- **Curriculum code format:** `{Year}.{Strand}.{SubStrand}.{Type}.{Seq}`, e.g. `1.1.1.LO.1` — identical scheme to Physics/Robotics/Chemistry.
- **Category B elements present:**
  - [x] Exemplars — "Learning Indicators and Pedagogical Exemplars with 21st Century and GESI" header (matches other subjects)
  - [x] Core Competencies — folded into "21st Century Skills and Competencies" (e.g. "Critical Thinking and Problem-Solving", "Creativity and Innovation", "Collaboration and Teamwork")
  - [x] Values — "GESI¹, SEL² and Shared National Values" column (footnoted, same convention as Chemistry); "National core values:" bullet list per outcome (note: lowercase "core values" here vs. "National Core Values" capitalised elsewhere — a real terminology variance to preserve verbatim, not normalise)
  - [x] Pedagogical guidance — named pedagogies (e.g. "Project-Based Learning Approach:")
  - [x] Assessment guidance — DoK Levels 1-4, same wording as other subjects
  - [x] Teaching and Learning Resources (TLR) — exact header "Teaching and Learning Resources" (page 101), listing concrete items (e.g. "Desktop computers", "The iBox/iCampus (CENDLOS)", "Instructional laboratories")
  - [x] Suggested Activities — embedded bullets under named pedagogies
  - [x] Cross-Cutting Themes — generic front-matter references only, not a per-node field
  - [x] GESI / [x] SEL / [x] National Values / [x] 21st Century Skills — all present
- **Extraction feasibility:** COMPLETE — native PDF text layer, extracted via `pdftotext -layout` (page-range flags; the Read tool's `pages` parameter is unusable in this environment because the underlying `pdftoppm`/poppler render binary is not installed). One page transition (around PDF page 23-24) produced a short run of corrupted/private-use-area glyphs (`'^Z/Z ^ZZZZ>`) in the raw text dump — likely a font-encoding artifact on a decorative rule/icon, not lost curriculum text (the surrounding SEL paragraph text is intact and continues correctly on the next page).
- **Notes on anything unusual or differing from other subjects:**
  - Scope and Sequence (page 20-21) gives clean overall totals: **18 Content Standards, 18 Learning Outcomes, 46 Learning Indicators** across SHS 1-3 — one Learning Outcome per Content Standard uniformly (unlike Chemistry, where some Content Standards had up to 7 Learning Indicators/Assessments).
  - The "Definition of Key Terms and Concepts in the Curriculum" front-matter glossary (page 18) explicitly defines Learning Outcomes, Learning Indicators, Content Standards, Pedagogical Exemplars, Assessment, and Teaching and Learning Resources in the curriculum's own words — a useful independent confirmation of Category A/B terminology, consistent with how this project's own Phase 3 categorisation uses those terms.
  - Same shared front-matter template as other subjects (SHS Curriculum Overview / Introduction / 21st Century Skills / GESI / SEL framework); same cover-page corruption artifact (a leftover Physical & Health Education title bleeding into the cover) was not independently re-checked for this file but is expected given the consistent pattern in every other sampled subject so far.

## Representative verbatim sample

Source: page 22-23 (printed footer "COMPUTING | 22" / "COMPUTING | 23")

```
Subject COMPUTING
Strand       1. COMPUTER ARCHITECTURE AND ORGANISATION
Sub-Strand  1. DATA STORAGE AND MANIPULATION

Learning Outcomes               21st Century Skills and Competencies                      GESI1, SEL2 and Shared National Values
1.1.1.LO.1
Apply Computer Architecture     Critical Thinking and Problem-Solving:                    GESI: As all learners are supported in an inclusive
concepts related to the design of Learners exhibit the ability to analyse, evaluate,      environment and given equal opportunities they will;
modern processors, memories,    and solve complex problems using logical and              � appreciate, value, and embrace diversity as they work in
Input and Output to manipulate  creative thinking in the Application of Computer          groups.
data.                           Architecture concepts.                                    � learn to amicably resolve conflicts and embrace different
                                                                                          opinions.
                                Creativity and Innovation: Learners exhibit
                                the capacity to generate original ideas, think            SEL: Learners strive to attain and utilise knowledge, skills,
                                outside the box, and approach tasks with a fresh          and attitudes that enable them to:
                                perspective with respect to the Application of            � cultivate a positive sense of self and foster healthy
                                Computer Architecture concepts.                           relationships with different identities while applying
                                                                                          Computer Architecture concepts.
National core values:
 Tolerance
 Integrity
 Accountability
 Humility
 Assertiveness
 Patriotism
```

(Teaching and Learning Resources block, printed page "COMPUTING | 101")

```
Teaching and Learning Resources
 Notepad or exercise book        Desktop computers                          The iBox/iCampus (CENDLOS)
 Pen
 Smartphones                     Tablets                                    Productivity tools ix. Subject-based
 Laptops
                                 TV and radio                                             application software
                                 Open Educational Resources                 Instructional laboratories (with
                                 (including YouTube, MOOCs -                              multimedia equipment and
                                 Udemy/Coursera, Khan Academy,                            smartboards)
                                 and TESSA)                                 Maintenance and repair workshops
```

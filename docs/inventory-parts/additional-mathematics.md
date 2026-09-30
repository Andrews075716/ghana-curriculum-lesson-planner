# ADDITIONAL MATHEMATICS CURRICULUM FOR SECONDARY EDUCATION (SHS 1 - 3)

- **Source file:** curriculum-sources/Additional-Mathematics-Curriculum.pdf
- **Subject:** Additional Mathematics
- **Level/Form/Class coverage:** SHS 1-3 (document organises content into "YEAR ONE", "YEAR TWO", "YEAR THREE")
- **Issuing authority:** National Council for Curriculum and Assessment (NaCCA), Ministry of Education, Republic of Ghana (in association with Ghana Education Service)
- **Publication year/version:** September 2023
- **Document format:** PDF
- **Page count:** 562 printed pages (footer reads "562 | ADDITIONAL MATHEMATICS" on the final content page); the extraction tool's own page index runs to 564 (a ~2-page offset from unnumbered cover/front pages before the printed-footer sequence starts, same pattern as Physics/Robotics)
- **Apparent structure (hierarchy levels, in order, exact terminology):**
  1. **Strand** (e.g. "STRAND 1. MODELLING WITH ALGEBRA")
  2. **Sub-Strand** (e.g. "SUB-STRAND 1. NUMBER AND ALGEBRAIC PATTERNS")
  3. **Learning Outcomes** (e.g. "1.1.1.LO.1") — presented in a table together with "21st Century Skills and Competencies" and "GESI, SEL and Shared National Values" columns
  4. **Content Standards** (e.g. "1.1.1.CS.1") — presented in a second, separate table together with "Learning Indicators and Pedagogical Exemplars with 21st Century Skills and Competencies, and GESI" and "Assessment" columns
  5. **Learning Indicators** (e.g. "1.1.1.LI.1"), each broken into one or more numbered **Activity** blocks (e.g. "Activity 1: Define and interpret Binary Operations as a rule", "Activity 2: Discuss the history and relevance of learning binary operations.") containing named pedagogies (Collaborative Learning, Talk for Learning Approaches, Experiential Learning, etc.)
  6. **Assessment** entries tied 1:1 to each Learning Indicator (e.g. "1.1.1.AS.1"), scored against Webb's DoK Levels 1-4 — unlike Physics, most Additional Mathematics Assessment cells contain bespoke worked problems (not just the four generic DoK level labels), e.g. an actual binary-operation problem under Level 1 and Level 4 for 1.1.1.AS.1.
  - Each Content Standard block ends with an inline "Teaching and Learning Resources" line/list.
  - Same two-table-per-Sub-Strand pattern as Physics/Robotics: LO/21st-Century/GESI table first, then CS/LI+Exemplars/Assessment table.
- **Curriculum code format:** `{Year}.{Strand}.{SubStrand}.{Type}.{SequenceNumber}`, e.g. `1.1.1.LO.1` (Learning Outcome), `1.1.1.CS.1` (Content Standard), `1.1.1.LI.1` (Learning Indicator), `1.1.1.AS.1` (Assessment). Later codes correctly follow the same pattern into Year 3, e.g. `3.4.2.LI.5`, `3.4.2.AS.5` (Year 3, Strand 4, Sub-Strand 2). No numbering typos were observed in the sampled pages (unlike the Physics/Agriculture documents), though only a sample of the ~562 pages was reviewed.
- **Category B elements present:**
  - [x] Exemplars — header "Pedagogical Exemplars" (combined into "Learning Indicators and Pedagogical Exemplars with 21st Century Skills and Competencies, and GESI")
  - [x] Core Competencies — not a standalone table header; referenced generically in front matter ("cross-cutting themes such as 21st Century skills, core competencies...")
  - [x] Values — "GESI1, SEL2 and Shared National Values" column header plus an embedded "National Core Values:" bullet list per Learning Outcome (e.g. Leadership and Respect for others' views, Diversity, Equity, Tolerance)
  - [x] Pedagogical guidance — named pedagogies embedded in the Learning Indicator/Activity text (e.g. "Collaborative Learning:", "Talk for Learning Approaches:", "Experiential Learning:", "Problem-Based Learning:", "Project-Based Learning:") plus a front-matter "Learning and Teaching Approaches" section
  - [x] Assessment guidance — "Assessment" column citing "Level 1 Recall / Level 2 Skills of conceptual understanding / Level 3 Strategic reasoning / Level 4 Extended critical thinking and reasoning" (Webb's DoK-aligned), here populated with subject-specific worked problems rather than the bare generic labels; front matter has "Curriculum and Assessment Design: Revised Bloom's Taxonomy and Webb's Depth of Knowledge"
  - [x] Teaching and Learning Resources (TLR) — exact header "Teaching and Learning Resources", appearing inline at the end of each Content Standard block (e.g. "SHS curriculum", "calculators")
  - [x] Suggested Activities — present, and more explicitly labelled here than in Physics/Robotics: numbered "Activity 1:", "Activity 2:", "Activity 3:" sub-blocks inside each Learning Indicator cell
  - [x] Cross-Cutting Themes — not a standalone header; referenced generically in front matter, same wording as Physics/Robotics
  - [x] GESI — exact acronym "GESI" (footnoted as "Gender Equality and Social Inclusion"), front-matter section "Gender Equality and Social Inclusion (GESI)", and inline "GESI:" sub-block per Learning Outcome
  - [x] SEL — exact acronym "SEL"; footnote 2 in the LO table defines it as **"Socio-Emotional Learning"** (differs from the front-matter section header "Social Emotional Learning (SEL): Five Core Competencies with Examples" — both spellings occur in this single document, same variability noted in Physics/Robotics); inline "SEL:" sub-block per Learning Outcome
  - [x] National Values — "National Core Values:" bullet list embedded per Learning Outcome (e.g. Leadership and Respect for others' views, Diversity, Equity)
  - [x] 21st Century Skills — exact header "21st Century Skills and Competencies"; front matter enumerates Critical Thinking and Problem-Solving, Creativity, Collaboration, Communication, Learning for Life, Global and Local (Glocal) Citizenship, Systems Thinking, Normative, Anticipatory, Strategic, Self-Awareness competencies
- **Extraction feasibility:** PARTIAL — front matter, Learning Outcomes/Content Standards/Learning Indicators/Assessment prose, GESI/SEL/National Values text, and Pedagogical Exemplars all extract cleanly as searchable text (native digital PDF, not scanned). However, this subject is unusually formula-heavy, and inline mathematical notation extracts with significant symbol corruption/garbling in many places — e.g. sampled text renders as `11, = !!! ,!7! = !!�!(�2�1 ,�"�) = 330`, `( = ) = 0 0%*0 where`, and fraction/exponent layouts collapse into single lines with stray characters (page 561-562, binomial-probability Learning Indicators). Formulas, fractions, combination/permutation notation (nCr, nPr), and some special characters (e.g. "�" appearing where an apostrophe or operator symbol should be) are not reliably recoverable from the text layer alone; these would likely need OCR-on-image or manual transcription for any formula-bearing Learning Indicator/Assessment cell. Table-wrap-across-page-break issues (as seen in Physics/Robotics) also occur here.
- **Notes on anything unusual or differing from other subjects:** (1) Same generic "THE SHS CURRICULUM OVERVIEW"/"INTRODUCTION" front matter (pages 7-21 printed) as the other SHS subject PDFs, including the identical leaked "PHYSICAL AND HEALLTRHEPUEBDLUICCAOTFIGOHNACNUARRAICULUM FOR BASIC 7 - 10" artifact overlapping the title text on PDF page 3 — confirms this is a shared copy-paste template across the whole SHS PDF batch. (2) The "SCOPE AND SEQUENCE" table (printed page 22) extracts with columns/rows visually interleaved by the `-layout` text extraction (numbers from different Strand/Sub-Strand rows appear to shuffle together), so the per-row Content Standard/Learning Outcome/Learning Indicator counts in that table should be treated as unreliable without re-verification against the underlying PDF table geometry; the table does clearly carry an "Overall Totals (SHS 1 - 3)" section, but which digits align to which total label is ambiguous in the raw text extraction and was not further disambiguated in this pass. (3) Content Standards blocks combine multiple sub-topics under one CS in places (e.g. 1.1.1.CS.1 covers "binary operations, sets and binomial theorem" together) rather than one narrow CS per topic. (4) Assessment cells contain real worked mathematics problems (not just the four generic DoK descriptor labels seen verbatim-repeated in Physics), making this document's Assessment column considerably richer/more extraction-valuable than Physics's, but also harder to extract with fidelity due to the formula-garbling issue above.

## Representative verbatim sample

Source: page(s) 24 (printed page number "24 | ADDITIONAL MATHEMATICS"; PDF document index page 26)

```
Subject     ADDITIONAL MATHEMATICS
Strand      1. MODELLING WITH ALGEBRA
Sub-Strand  1. NUMBER AND ALGEBRAIC PATTERNS

Learning Outcomes
1.1.1.LO.1
Solve problems involving properties of binary operations.

21st Century Skills and Competencies
Communication: Provide learners the opportunity to engage and participate
in mathematical talk, ensuring that learners are tolerant to listen to the views
and perspectives of others and use appropriate vocabulary confidently and
effectively to present their ideas.

Collaboration: Create an atmosphere, environment and opportunity that
fosters the spirit of team success where learners understand and respect the
needs, contributions, perspectives, and actions of others whilst they embark on
project works, classroom activities and presentations.

GESI1, SEL2 and Shared National Values
GESI: Learners having experienced a teaching approach that ensures
gender equality and social inclusion, where they work with each other in
an inclusive way; cross-sharing knowledge and understanding among
groups and individuals lead them to:
1. Respect individuals of different backgrounds in their groups as they solve
   problems involving properties of binary operations using appropriate
   technological tools.
2. Interrogate their stereotypes and biases about the roles and abilities of
   different groups as they learn how to solve problems involving properties
   of binary operations.

1 Gender Equality and Social Inclusion
2 Socio-Emotional Learning
```

(Content Standards / Learning Indicators / Assessment table, same Sub-Strand, printed page "37 | ADDITIONAL MATHEMATICS", PDF document index page 39)

```
Content Standards: 1.1.1.CS.1
Demonstrate knowledge and understanding of binary operations, sets and
binomial theorem and solve related problems in real life situations.

Learning Indicators and Pedagogical Exemplars with 21st Century Skills and Competencies, and GESI: 1.1.1.LI.1
Explain binary operations and apply that knowledge in solving related problems.

Collaborative Learning: Learners will work in convenient groups (ability, mixed-
ability, mixed gender, or pairs etc.) to identify and define binary operations over
given sets and solve related problems.

Talk for Learning Approaches: Learners will brainstorm by way of think-pair-
share/square and debate on sets defined by binary operations and establish the
rules for such binary operations.

Activity 1: Define and interpret Binary Operations as a rule
Use Talk for Learning Approaches (building on what others say, managing Talk for
Learning, structuring Talk for Learning), collaborative learning approaches and
experiential learning approaches to recall the four basic operations and use them to
define a binary operation.

Assessment: 1.1.1.AS.1
Level 1 Recall
The operation * is defined on the set of real numbers R by
   a * b = 2a + b - 2.
a) Find
   i. 3 * -2
   ii. 3 * 5
b) If a * 4 = -2 find the value of a.

Level 4 Extended critical thinking and reasoning
You have six shirts, two trousers and two pairs of shoes. Explain how you will use
the binary operation to determine how many ways a shirt, a trouser and a pair of
shoes can be worn
```

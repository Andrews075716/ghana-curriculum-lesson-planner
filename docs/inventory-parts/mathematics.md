# MATHEMATICS CURRICULUM FOR SECONDARY EDUCATION (SHS 1 - 3)

- **Source file:** curriculum-sources/Mathematics-Curriculum.pdf
- **Subject:** Mathematics
- **Level/Form/Class coverage:** SHS 1-3 (document organises content into "YEAR ONE", "YEAR TWO", "YEAR THREE")
- **Issuing authority:** National Council for Curriculum and Assessment (NaCCA), Ministry of Education, Republic of Ghana (Ghana Education Service also credited)
- **Publication year/version:** September 2023
- **Document format:** PDF
- **Page count:** 386 PDF pages total (via text-layer page split). Printed page-footer numbers run "2 | MATHEMATICS" (PDF page 4) through "MATHEMATICS | 383" (PDF page 385), with PDF page 386 blank — i.e. printed pagination tops out at 383, with a consistent ~2-page offset from PDF index throughout (cover + front unlabelled page precede the numbered footer sequence). This is a large document (~7.8MB); sampled via targeted page extraction (front matter, scope and sequence, one Year-1 sub-strand in full, and the final content pages) rather than read cover-to-cover.
- **Apparent structure (hierarchy levels, in order, exact terminology):**
  1. **Strand** (e.g. "Strand 1. NUMBERS FOR EVERYDAY LIFE") — note: "Strand" is printed in title case followed by a period and number, with the strand name in caps (this differs from Physics's fully-capitalised "STRAND 1. ...")
  2. **Sub-Strand** (e.g. "Sub-Strand 1. REAL NUMBER SYSTEM")
  3. **Content Standards** (e.g. "1.1.1.CS.1")
  4. **Learning Outcomes** (e.g. "1.1.1.LO.1") — presented in a separate table above the Content Standards table, same as Physics/Robotics
  5. **Learning Indicators** (e.g. "1.1.1.LI.1") — presented together with **Pedagogical Exemplars** in one combined column, paired 1:1 with **Assessment** entries (e.g. "1.1.1.AS.1")
  - Each Sub-Strand ends with a "Teaching and Learning Resources" block.
  - Same two-table-per-Sub-Strand pattern as Physics/Robotics: Table A = "Learning Outcomes | 21st-Century Skills and Competencies | GESI, SEL and Shared National Values"; Table B = "Content Standards | Learning Indicators and Pedagogical Exemplars with 21st-century Skills and Competencies, and GESI | Assessment".
  - Under each Learning Indicator, worked "Examples:" (numbered i., ii., iii. ...) are given instead of, or in addition to, named pedagogical-strategy bullet lists — a slightly different flavour of "Suggested Activities" than the bulleted narrative prose seen in Physics/Robotics (Mathematics examples are frequently literal worked maths problems, e.g. probability/statistics word problems).
- **Curriculum code format:** `{Year}.{Strand}.{SubStrand}.{Type}.{SequenceNumber}`, e.g. `1.1.1.LO.1` (Learning Outcome), `1.1.1.CS.1` (Content Standard), `1.1.1.LI.1` (Learning Indicator), `1.1.1.AS.1` (Assessment). First digit = SHS Year (1, 2 or 3); confirmed with a Year-3 example from the final pages: `3.4.2.CS.1` / `3.4.2.LI.1` / `3.4.2.AS.1` / `3.4.2.AS.2` (Year 3, Strand 4, Sub-Strand 2).
- **Category B elements present:**
  - [x] Exemplars — header "Pedagogical Exemplars" combined into the table column header "Learning Indicators and Pedagogical Exemplars with 21st-century Skills and Competencies, and GESI"
  - [x] Core Competencies — header "21st-Century Skills and Competencies" (Learning Outcomes table column); itemised per outcome (e.g. "Communication and Collaboration", "Strategic Competency", "Critical Thinking", "Technology Literacy Skills")
  - [x] Values — combined header "GESI, SEL and Shared National Values" (note: raw text extraction shows "GESI1, SEL2 and Shared National Values" — superscript footnote markers "1"/"2" on GESI and SEL, apparently referencing footnote definitions, extracted inline as plain digits) plus a "National Core Values:" bullet list per Learning Outcome (e.g. "Leadership and Respect for others' views", "Diversity", "Equity", "Truth and Integrity", "Tolerance")
  - [x] Pedagogical guidance — named pedagogies embedded in the Learning Indicator cell (e.g. "Problem-based Learning, Talk for Learning, Experiential Learning, and Group Work/Collaborative Learning", "Diamond Nine", "Think-pair-share") plus the shared front-matter "Learning and Teaching Approaches" section (near-identical wording to Physics/Robotics)
  - [x] Assessment guidance — "Assessment" column citing the same generic "Level 1 Recall / Level 2 Skills of conceptual understanding / Level 3 Strategic reasoning / Level 4 Extended critical thinking and reasoning" DoK-aligned four-level list per Learning Indicator; shared front-matter section "Curriculum and Assessment Design: Revised Bloom's Taxonomy and Webb's Depth of Knowledge"
  - [x] Teaching and Learning Resources (TLR) — exact header "Teaching and Learning Resources" (rendered in the layout-extracted text as a two-line label "Teaching and / Learning Resources"), listed per Sub-Strand end (e.g. "Manipulative (dice, coins, spinners, playing cards, counters, digit cards)", "Simple Probability Mazes (Printable & Digital)", "Worksheets", "Task Cards", "Mathematical sets")
  - [x] Suggested Activities — present as numbered "Examples:" sub-items inside the Learning Indicator cell (not a separately labelled column), frequently literal worked mathematics problems rather than narrative classroom-activity prose
  - [x] Cross-Cutting Themes — not a standalone header; referenced generically in front matter identically to Physics/Robotics ("cross-cutting themes such as 21st Century skills, core competencies, the use of ICT, literacy and mathematics, Social Emotional Learning, Gender Equality and Social Inclusion")
  - [x] GESI — exact acronym "GESI" (Gender Equality and Social Inclusion), defined in front matter (page "MATHEMATICS | 9") and appears as a labelled "GESI:" sub-block inside almost every Learning Outcome row
  - [x] SEL — exact acronym "SEL", "Social Emotional Learning (SEL): Five Core Competencies with Examples" in front matter (Self-Awareness, Self-Management, Social Awareness, Relationship Skills, Responsible Decision-Making); appears as "SEL:" sub-block per Learning Outcome
  - [x] National Values — "Shared National Values" (table header) / "National Core Values:" (per-LO bullet list)
  - [x] 21st Century Skills — header "21st-Century Skills and Competencies" (note the hyphenation "21st-Century"/"21st-century" varies by table — differs from Physics's "21St Century" and Robotics's "21st Century" spellings, an inconsistency in the source itself); front matter enumerates the same competency list as Physics/Robotics (Critical Thinking and Problem-Solving, Creativity, Collaboration, Communication, Learning for Life, Global and Local (Glocal) Citizenship, Systems Thinking, Normative, Anticipatory, Strategic, Self-Awareness Competency)
- **Extraction feasibility:** COMPLETE — text layer extracts cleanly (native digital PDF, not scanned) via `pdftotext -layout`. Caveats: (1) several pages contain embedded diagrams/figures (e.g. number-line diagrams, "Wheel of Theodorus" figure) whose labels extract as garbled/overlapping characters (e.g. stray symbols like "d", "EZd", "&||" in the raw text dump) — these are figure captions/labels that did not extract cleanly, not curriculum text; (2) mathematical notation (fractions, set-builder notation, square-root symbols) frequently does not extract with correct symbol fidelity (e.g. "≠" style symbols render as blanks or stray glyphs) and will need manual/OCR cross-check for any content-critical formulas; (3) as with Physics/Robotics, wide multi-column tables cause some text-wrapping/interleaving across page breaks.
- **Notes on anything unusual or differing from other subjects:** (1) Front matter (pages 1-20, printed pages 1-18) is near-identical generic "THE SHS CURRICULUM OVERVIEW"/"INTRODUCTION" boilerplate shared across SHS subjects, including the same leaked title-block artifact seen in Physics/Robotics: PDF page 3 of this file contains "PHYSICAL AND HEALRTEPUHBLICEODF GUHACNAATION CURRICULUM FOR BASIC 7 - 10 (COMMMOANTCHOERME PARTOICGRSAMME)" — a garbled/interleaved copy-paste artifact from the Physical Education front-matter template (the garbling itself, interleaving "PHYSICAL AND HEALTH EDUCATION" with "REPUBLIC OF GHANA", appears to be a rendering/extraction artifact of two overlapping text layers on that page, not necessarily present in the visual PDF). (2) "SCOPE AND SEQUENCE" summary table (PDF page 24, printed page 22) gives Overall Totals for SHS 1-3: **Content Standards: 40, Learning Outcomes: 42, Learning Indicators: 108** — lower LI count than Physics (188) or comparable order to Robotics (63), consistent with Mathematics condensing more content per indicator. (3) The Learning Outcomes/Content Standards table headers use inconsistent capitalisation/hyphenation of "21st Century" across the document ("21st-Century Skills and Competencies" in the LO table vs "21st-century Skills and Competencies" in the CS/LI/Assessment table) — a verbatim inconsistency in the source, not a transcription error. (4) This is by far the largest of the four PDFs sampled in this batch (386 PDF pages / 383 printed pages vs. ~90-176 for the other three) and was sampled rather than read exhaustively, per instructions — front matter, the Scope and Sequence table, one full Year-1 Sub-Strand (Strand 1/Sub-Strand 1, pages 26-33), and the final Year-3 content pages (383-385) were read directly; the bulk of the interior Year 1/2/3 content (pages ~34-382) was not individually reviewed and is assumed structurally consistent based on the sampled sections, the Contents/Scope-and-Sequence listing, and the shared front-matter template.

## Representative verbatim sample

Source: page(s) 24-25 (printed page "MATHEMATICS | 24"; PDF document index page 26) — Learning Outcome table, Strand 1/Sub-Strand 1, Year One

```
Subject        MATHEMATICS
Strand 1.      NUMBERS FOR EVERYDAY LIFE
Sub-Strand 1.  REAL NUMBER SYSTEM

Learning Outcomes
1.1.1.LO.1
Apply the relationships and differences between the set of rational and
irrational numbers and use them to solve problems.

21st-Century Skills and Competencies
Communication and Collaboration: Learners communicate confidently and
effectively to develop appropriate mathematics vocabulary for real numbers
through teamwork.

Strategic Competency: Make conscious efforts to enable learners to
collectively develop and implement innovative actions that promote
sustainability at their level, leading to application to lifelong learning and
further studies.

Critical Thinking: Create sustainable discourse for learners to question
norms, practices, and opinions; to reflect on one's own values, perceptions
and actions for decision-making.

GESI1, SEL2 and Shared National Values
GESI: Learners having experienced a teaching approach that ensures gender
equality and social inclusion, where they work with each other in an
inclusive way; cross-sharing knowledge and understanding among groups
and individuals lead them to:
 Respect individuals of different backgrounds in their groups as they
discuss and solve problems in mathematics involving rational and
irrational numbers.
 Interrogate their stereotypes and biases about the roles and abilities
of different individuals in learning and applying mathematics.
 Examine and dispel misconceptions/ myths about GESI as they engage
in a sustainable discourse while learning sets of rational and irrational
numbers.
 Value and promote justice as they develop and implement innovative
actions in the mathematics classroom and beyond.

National Core Values:
Leadership and Respect for others' views: Inculcate the habit of leadership
through teamwork and respect for individuals' views, beliefs, religions, and
cultures through interactive and collaborative/group work in the course of
learning the real number system.
```

(Content Standards / Learning Indicators / Assessment table, same Sub-Strand, printed page "MATHEMATICS | 29"; PDF document index page 31)

```
Content Standards       Learning Indicators and Pedagogical Exemplars with 21st-century Skills and
1.1.1.CS.1               Competencies, and GESI
Demonstrate              1.1.1.LI.1
knowledge and
understanding of real   Develop the real number system using the closure property.
number systems and
the operations of the   Problem-based Learning, Talk for Learning, Experiential Learning, and Group
various subsets.        Work/Collaborative Learning.
                         Review learners' knowledge of basic concepts of numbers, deal with their misconceptions or
                         preconceptions about such concepts, audit their difficulties and transition to develop the set of real
                         numbers, using closure properties and applying such to solve real life problems. While doing so,
                         encourage learners to be truthful and honest in their responses within their collaborative groups.

                         Examples:
                         i. Establish, through a variety of differentiated strategies, the set of real numbers (rational and
                             irrational) using models such as number lines, number tracks, algebraic tiles, multibase arithmetic
                             blocks, etc., in a socio-emotional learning environment that ensures the development of values
                             such as diversity, equity and respect for others.

                         ii. Extend the closure property to determine if the subsets of real numbers are closed with
                              respect to addition (+), multiplication (*), division (÷) and subtraction (-). Include steps
                              for establishing other properties of real numbers (i.e., additive and multiplicative inverses,
                              distributive, etc.). Be mindful of values such as self-confidence, diversity and leadership in
                              achieving strategic critical thinking.

Assessment (1.1.1.AS.1, paired with 1.1.1.LI.1):
Level 1 Recall
Level 2 Skills of conceptual understanding
Level 3 Strategic reasoning
Level 4 Extended critical thinking and reasoning
```

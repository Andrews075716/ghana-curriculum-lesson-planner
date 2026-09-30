# ECONOMICS CURRICULUM FOR SECONDARY EDUCATION (SHS 1 - 3)

- **Source file:** curriculum-sources/Economics-Curriculum-Curriculum.pdf (filename has a doubled "Curriculum-Curriculum"; the subject itself is "Economics" — confirmed by the cover page title "ECONOMICS CURRICULUM FOR SECONDARY EDUCATION (SHS 1 - 3)")
- **Subject:** Economics
- **Level/Form/Class coverage:** SHS 1-3 ("YEAR ONE", "YEAR TWO", "YEAR THREE")
- **Issuing authority:** National Council for Curriculum and Assessment (NaCCA), Ministry of Education, Republic of Ghana (Ghana Education Service also credited)
- **Publication year/version:** September 2023 (cover title block again shows the same garbled overlapping-text artifact "SESePpTtEeMmBbeErR, 22002230" seen in DCT; copyright line "©2023 National Council for Curriculum and Assessment (NaCCA)" confirms 2023)
- **Document format:** PDF
- **Page count:** 123 pages by extraction-tool page count (form-feed count via `pdftotext`); last content page's printed footer reads "122 | ECONOMICS" — 1-page offset consistent with an unnumbered cover page preceding the numbered footer sequence (same pattern as Physics/Robotics/DCT)
- **Apparent structure (hierarchy levels, in order, exact terminology):**
  1. **Strand** (e.g. "STRAND 1. CONSUMERS' RATIONAL DECISION MAKING" / in-table "Strand 1. CONSUMERS' RATIONAL DECISION MAKING")
  2. **Sub-Strand** (e.g. "SUB-STRAND 1. INTRODUCTION TO THE SUBJECT ECONOMICS" / in-table "Sub-Strand 1. INTRODUCTION TO THE SUBJECT ECONOMICS")
  3. **Learning Outcomes** (e.g. "1.1.1.LO.1") — table with "21st Century Skills and Competencies" and "GESI, SEL and Shared National Values" columns
  4. **Content Standards** (e.g. "1.1.1.CS.1") — separate table, column header printed as "Content Standards"
  5. **Learning Indicators** (e.g. "1.1.1.LI.1") — same cell as, combined with, "Pedagogical Exemplars with 21st Century and GESI"
  6. **Assessment** entries per Learning Indicator (e.g. "1.1.1.AS.1"), same four-level Webb's DoK scale as other subjects reviewed ("Level 1 Recall / Level 2 Skills of conceptual understanding / Level 3 Strategic reasoning / Level 4 Extended critical thinking and reasoning")
  - Each Sub-Strand block ends with a **"Teaching and Learning Materials"** list (same terminology as DCT, not "Teaching and Learning Resources" as in Physics/Robotics).
  - Same two-table-per-Sub-Strand pattern: Table A = Learning Outcomes | 21st Century Skills and Competencies | GESI, SEL and Shared National Values; Table B = Content Standards | Learning Indicators and Pedagogical Exemplars with 21st Century and GESI | Assessment.
- **Curriculum code format:** `{Year}.{Strand}.{SubStrand}.{Type}.{SequenceNumber}`, e.g. `1.1.1.LO.1` (Learning Outcome), `1.1.1.CS.1` (Content Standard), `1.1.1.LI.1` (Learning Indicator), `1.1.1.AS.1` (Assessment). Same scheme as Physics/Robotics/DCT. A late-document example: `3.4.3.CS.2` / `3.4.3.LI.1` / `3.4.3.AS.1` (Year 3, Strand 4, Sub-Strand 3) — note the Content Standard sequence number here is ".2" not ".1", i.e. this Sub-Strand's Content Standards are not always numbered starting at 1 in sequence with the Learning Indicators shown.
- **Category B elements present:**
  - [x] Exemplars — header "Pedagogical Exemplars" (combined column header "Learning Indicators and Pedagogical Exemplars with 21st Century and GESI")
  - [x] Core Competencies — not a standalone verbatim header in the tables; functionally covered under "21st Century Skills and Competencies" per-row entries (e.g. "Communication:", "Critical Thinking:", "Collaboration:", "Learning for Life:", "Interpersonal Skills:")
  - [x] Values — header "GESI, SEL and Shared National Values" (table column) plus inline "National Core Values:" text per Learning Outcome (e.g. "Tolerance, friendliness, open-mindedness, patience, commitment and hard work")
  - [x] Pedagogical guidance — named pedagogies embedded in the Learning Indicators column (e.g. "Building on What Others Say:", "Collaborative Learning:", "Talk for Learning Approaches (TfL):", "Experiential Learning:")
  - [x] Assessment guidance — "Assessment" column with the same four-level DoK scale per Learning Indicator; front-matter Definition of Key Terms includes "Assessment:" entry
  - [x] Teaching and Learning Resources (TLR) — front-matter glossary term is "Teaching and Learning Resources", but the printed per-Sub-Strand block header in the body is **"Teaching and Learning Materials"** (e.g. "Marker, Computers, Ruler, Graph books, White board, Pen, Exercise books...") — same discrepancy observed in DCT
  - [x] Suggested Activities — bulleted/named sub-steps embedded inside Pedagogical Exemplars text, not a separate column
  - [x] Cross-Cutting Themes — not a standalone header; referenced generically in front matter only
  - [x] GESI — exact heading "Gender Equality and Social Inclusion (GESI)" in front matter (page ~9); footnote markers "1Gender Equality and Social Inclusion" appear on early Learning Outcome tables; inline "GESI:" sub-block per Learning Outcome row
  - [x] SEL — front matter "Social and Emotional Learning (SEL)"; body inline "SEL:" sub-block referencing "Socio-Emotional Learning Competencies - Self-Awareness, Self-Management, Social Awareness, Relationship Skills and Responsible Decisions" per Learning Outcome
  - [x] National Values — "Shared National Values" (column header) / "National Core Values:" (inline per-LO text)
  - [x] 21st Century Skills — exact header "21st Century Skills and Competencies" (front matter and table column header)
- **Extraction feasibility:** COMPLETE — native digital PDF text layer, extracts cleanly via `pdftotext`. Caveats: (1) the cover page again contains the same overlapping/duplicated title-block rendering as DCT and a leftover "PHYSICAL AND HEALTH EDUCATION CURRICULUM FOR BASIC 7-10 (COMMON CORE PROGRAMME)" template artifact, garbling extraction on that one page; (2) a short run of unreadable glyph characters (e.g. `'^Z/Z` / `^ZZZZ>`) appears around printed page "ECONOMICS | 23" in the raw text extraction — likely an inline icon/image element that has no meaningful text equivalent, not actual curriculum content; (3) the "SCOPE AND SEQUENCE" summary table (page 21) extracts with numeric columns (CS/LO/LI per Strand per Year) badly run together (e.g. "1 24", "12 13 28 13") due to dense multi-column layout — will need careful re-derivation or manual cross-check rather than automated parsing; (4) multi-column Learning Outcome/Content Standard tables occasionally wrap/interleave text across page breaks, same as other subjects reviewed.
- **Notes on anything unusual or differing from other subjects:** (1) Front matter (pages 3-19-ish) is the same generic "SHS Curriculum Overview" boilerplate seen in Physics/Robotics/DCT, including the same leftover foreign-subject template artifact on the cover page. (2) Filename has a doubled "-Curriculum-Curriculum" suffix, apparently a naming/export error at the source, but the actual document content is unambiguously the Economics curriculum. (3) Like DCT, this document uses "Teaching and Learning Materials" as its in-body resources header rather than "Teaching and Learning Resources" (the term Physics/Robotics use), even though front matter defines the term as "Teaching and Learning Resources" — suggests DCT and Economics may share a template lineage distinct from Physics/Robotics. (4) The Scope and Sequence table (page 21) gives an "Overall Totals (SHS 1-3)" of 37 Content Standards, 38 Learning Outcomes, 84 Learning Indicators — note Content Standards (37) and Learning Outcomes (38) counts differ by one, unlike Physics where CS and LO totals matched exactly (59 = 59); this is worth flagging as a possible non-1:1 CS:LO relationship specific to Economics, consistent with the CS numbering anomaly noted above (e.g. `3.4.3.CS.2` appearing without an accompanying `.CS.1` visible in the same block sampled). (5) Some Assessment blocks late in the document use a colon after each DoK level label (e.g. "Level 1 Recall:") whereas earlier blocks omit the trailing colon — a minor formatting inconsistency within the same document, not corrected here.

## Representative verbatim sample

Source: page(s) 23 (printed page number "ECONOMICS | 23"), Year One, Strand 1 / Sub-Strand 1

```
Subject ECONOMICS
Strand      1. CONSUMERS' RATIONAL DECISION MAKING
Sub-Strand  1. INTRODUCTION TO THE SUBJECT ECONOMICS

Learning Outcomes
1.1.1.LO.1
Use relevant information gathered from learners' home, school and community
through observation to carefully define economics and stimulate their interest
in the subject.

21st Century Skills and Competencies
Communication: Through role-play, learners effectively communicate verbally and non-verbally
through writing.
Critical Thinking: In the mixed ability and gender groups, reflect on one's own needs and
arrange them in order of importance.
Learning for Life: Apply fundamental demand concepts to daily life.
Interpersonal Skills: Ability to work with different ability and gender.

GESI1, SEL2 and Shared National Values
GESI: Working with each other in an inclusive way, cross sharing of knowledge and understanding
between and among groups and individuals for instance leads to;
 respecting individuals of varying beliefs, religion and cultures when dealing with economics
issues.
 being sensitive to the inter-relatedness of the various spheres of life, groups and individuals
in solving national economic problems.
 being aware of personal biases and stereotypes and creating a safe space for both boys and
girls to aid economic development.
 embracing diversity and practice inclusion.

SEL: Creating opportunities for learners to build their Socio-Emotional Learning Competencies -
Self-Awareness, Self-Management, Social Awareness, Relationship Skills and Responsible Decisions
are integrated throughout all lessons to encourage inclusion.
```

(Content Standards / Learning Indicators / Assessment table, same Sub-Strand, printed page "ECONOMICS | 25")

```
Content Standards: 1.1.1.CS.1
Demonstrate knowledge and understanding of fundamental concepts and tools used in Economics.

Learning Indicators and Pedagogical Exemplars with 21st Century and GESI: 1.1.1.LI.1
Use learners' everyday life experiences in defining Economics and stimulate their interest.

Building on What Others Say: Brainstorm in mixed ability and gender groups using previous
knowledge acquired in the home, school and community to explain their understanding of
Economics. Use mind maps and webs to organise views. Personal development through individual
contributions during group work based on diverse interests and abilities. Learners should be
encouraged to exhibit tolerance, commitment, and respect during group work.

Assessment: 1.1.1.AS.1
Level 1 Recall
Level 2 Skills of conceptual understanding
Level 3 Strategic reasoning
Level 4 Extended critical thinking and reasoning
```

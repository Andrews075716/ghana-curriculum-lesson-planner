# DESIGN AND COMMUNICATION TECHNOLOGY CURRICULUM FOR SECONDARY EDUCATION (SHS 1 - 3)

- **Source file:** curriculum-sources/Design-Communication-Technology-Curriculum.pdf
- **Subject:** Design and Communication Technology
- **Level/Form/Class coverage:** SHS 1-3 (document organises content into "YEAR ONE", "YEAR TWO", "YEAR THREE")
- **Issuing authority:** National Council for Curriculum and Assessment (NaCCA), Ministry of Education, Republic of Ghana (Ghana Education Service also credited)
- **Publication year/version:** September 2023 (cover page shows a garbled/overlapping OCR-style artifact reading "SESePpTtEeMmBbeErR, 22002230" from an overlapping title-block image, but the plain text elsewhere and the copyright line "©2023 National Council for Curriculum and Assessment (NaCCA)" confirm 2023; the document title block elsewhere reads plainly "SEPTEMBER 2023")
- **Document format:** PDF
- **Page count:** 108 pages by extraction-tool page count (form-feed count via `pdftotext`); the last content page's printed footer reads "DESIGN AND COMMUNICATION TECHNOLOGY | 107" — a 1-page offset consistent with the unnumbered cover page preceding the numbered footer sequence (same pattern as Physics/Robotics)
- **Apparent structure (hierarchy levels, in order, exact terminology):**
  1. **Strand** (e.g. "STRAND 1. CONCEPTUAL DRAWING" / in-table "Strand 1. CONCEPTUAL DRAWING")
  2. **Sub-Strand** (e.g. "SUB-STRAND 1. CONCEPT SKETCHES" / in-table "Sub-Strand 1. CONCEPT SKETCHES")
  3. **Learning Outcomes** (e.g. "1.1.1.LO.1") — presented in a table together with "21st Century Skills and Competencies" and "GESI, SEL and Shared National Values" columns
  4. **Content Standards** (e.g. "1.1.1.CS.1") — separate table, paired with...
  5. **Learning Indicators** (e.g. "1.1.1.LI.1") — inside the same cell as, and combined with, "Pedagogical Exemplars with 21st Century and GESI"
  6. **Assessment** entries tied to each Learning Indicator (e.g. "1.1.1.AS.1"), scored against the same four-level Webb's DoK scale as Physics/Robotics
  - Each Sub-Strand block ends with a "Teaching and Learning Materials" list (NOTE: this document consistently uses the label **"Teaching and Learning Materials"**, not "Teaching and Learning Resources" as in Physics/Robotics — see Notes).
  - Same two-table-per-Sub-Strand pattern as Physics/Robotics: Table A = Learning Outcomes | 21st Century Skills and Competencies | GESI, SEL and Shared National Values; Table B = Content Standards | Learning Indicators and Pedagogical Exemplars with 21st Century and GESI | Assessment.
- **Curriculum code format:** `{Year}.{Strand}.{SubStrand}.{Type}.{SequenceNumber}`, e.g. `1.1.1.LO.1` (Learning Outcome, Year 1, Strand 1, Sub-Strand 1), `1.1.1.CS.1` (Content Standard), `1.1.1.LI.1` (Learning Indicator), `1.1.1.AS.1` (Assessment). Same scheme as Physics/Robotics; deeper into the document codes such as `3.3.3.LI.3` and `3.3.3.AS.4` appear (Year 3, Strand 3, Sub-Strand 3).
- **Category B elements present:**
  - [x] Exemplars — header "Pedagogical Exemplars" (combined column header "Learning Indicators and Pedagogical Exemplars with 21st Century and GESI")
  - [x] Core Competencies — not a standalone verbatim header in the tables; covered functionally under "21st Century Skills and Competencies"; front matter section is titled "The following sections elaborate on the critical competencies required of every SHS learner" followed by named competencies (Critical Thinking and Problem-Solving Competency, Creativity, etc.)
  - [x] Values — header "GESI, SEL and Shared National Values" (table column) plus inline "National Core Values:" bullet/sentence per Learning Outcome row
  - [x] Pedagogical guidance — named pedagogies embedded in the Learning Indicators column (e.g. "Group Work/Collaborative Learning:", "Problem-based Learning/Experiential Learning:", "Project-based learning:", "Research, group work:") plus front-matter "Learning and Teaching Approaches"-style prose
  - [x] Assessment guidance — "Assessment" column with "Level 1 Recall / Level 2 Skills of conceptual understanding / Level 3 Strategic reasoning / Level 4 Extended critical thinking and reasoning" per Learning Indicator (Webb's DoK-aligned, same as Physics/Robotics); front matter Definition of Key Terms includes an "Assessment:" definition
  - [x] Teaching and Learning Resources (TLR) — front-matter Definition of Key Terms uses the term "Teaching and Learning Resources", but the actual per-Sub-Strand block header printed in the body is **"Teaching and Learning Materials"** (e.g. "Teaching and Learning Materials — Models, Drawing studio, Access to internet, Charts, Drawing instruments, LCD Projector, Reference books")
  - [x] Suggested Activities — present as bulleted/named sub-steps inside the Pedagogical Exemplars text, not a separately labelled column (same pattern as Physics/Robotics)
  - [x] Cross-Cutting Themes — not a standalone header; referenced generically in front matter ("guidance on pedagogy, coupled with exemplars, demonstrating how to integrate cross-cutting themes such as 21st Century skills, core competencies, the use of ICT, literacy and mathematics, Social Emotional Learning, Gender Equality and Social Inclusion")
  - [x] GESI — exact heading "Gender Equality and Social Inclusion (GESI)" in front matter (page 8); per-row footnote "1Gender Equality and Social Inclusion"; inline "GESI:" sub-block per Learning Outcome row
  - [x] SEL — footnote "2Socio-Emotional Learning" (note: this document spells out SEL's expansion as "Socio-Emotional Learning", differing slightly from Physics's "Social and Emotional Learning" / "Socio-Emotional Learning" dual usage); inline "SEL:" sub-block per Learning Outcome row
  - [x] National Values — "Shared National Values" (table column header) / "National Core Values:" (per-LO inline text)
  - [x] 21st Century Skills — exact header "21st Century Skills and Competencies" in front matter (page 8) and as a table column header
- **Extraction feasibility:** COMPLETE — native digital PDF text layer, extracts cleanly via `pdftotext`. Caveats: (1) the cover page (page 1) contains an overlapping/duplicated title-block rendering ("PHYSICAL AND HEALRTEPUHBLICEODF GUHACNAATION CURRICULUM" and interleaved "SESePpTtEeMmBbeErR, 22002230") — a leftover template artifact, same phenomenon noted in Physics/Robotics, that garbles text extraction on that one page only; (2) the "SCOPE AND SEQUENCE" pages (20-23) contain three alternative summary-table layouts labelled "Option 1", "Option 2" and "Option 3" for the Year 2-3 breakdown, and these tables extract with numbers running together (e.g. "1 13" ambiguous between "1", "1", "3" columns) — automated parsing of these specific summary tables will need care, though the body content tables (LO/CS/LI/Assessment) extract cleanly; (3) multi-column table wrapping occasionally interleaves adjacent cells in raw linear extraction (same pattern as Physics/Robotics).
- **Notes on anything unusual or differing from other subjects:** (1) Front matter (pages 3-19) is the same generic "SHS Curriculum Overview" boilerplate seen in Physics/Robotics (21st Century Skills, GESI, SEL, Definition of Key Terms, etc.), including the same leftover "PHYSICAL AND HEALTH EDUCATION CURRICULUM FOR BASIC 7-10" template artifact on the cover page. (2) UNIQUE TO THIS SUBJECT: the "SCOPE AND SEQUENCE" section (pages 20-23) presents THREE alternative summary tables for Years 2-3 — "Design and Communication Technology Summary - Option 1", "- Option 2", and "- Option 3" — each with different Sub-Strand combinations and different totals (Option 1: 17 Content Standards/17 LO/48 LI; Option 2: 17 CS/17 LO/46 LI; Option 3: 16 CS/16 LO/46 LI), suggesting the curriculum offers alternative pathways/electives for SHS 2-3 rather than one fixed sequence — this is a structural pattern not seen in Physics or Robotics and may need special handling if the app models one linear Strand/Sub-Strand sequence per subject. Year 1 has a single, non-optional summary (7 CS/7 LO/23 LI). (3) The per-Sub-Strand resources block is consistently labelled "Teaching and Learning Materials" in-body (not "Teaching and Learning Resources" as in Physics/Robotics), even though the front-matter glossary defines the term as "Teaching and Learning Resources" — a terminology inconsistency between front matter and body tables within the same document.

## Representative verbatim sample

Source: page(s) 25 (printed page number "DESIGN AND COMMUNICATION TECHNOLOGY | 25"), Year One, Strand 1 / Sub-Strand 1

```
Subject     DESIGN AND COMMUNICATION TECHNOLOGY
Strand      1. CONCEPTUAL DRAWING
Sub-Strand  1. CONCEPT SKETCHES

Learning Outcomes
1.1.1.LO.1
Apply knowledge and skills of the concept sketches to generate and
create designs using freehand drawing through the principles of perspective
drawing and proportions.

21st Century Skills and Competencies
The group activity ensures collaboration among learners
The research activity facilitates critical thinking and communication skills
Individual learning activities encourage originality and critical thinking
The experiential learning approach allows for a deeper understanding of the
subject matter as learners connect theoretical knowledge to real-world applications.

GESI1, SEL2 and Shared National Values
GESI:
 Grouping learners into mixed gender ensures gender equality
 Grouping learners into mixed ability groupings encourages equal participation
among learners
SEL: Through individual learning experiences, learners often gain deeper insights into
their own strengths, weaknesses, preferences, and emotional responses
National Core Values: Experiential learning encourages individuals to take on leadership
roles, solve problems creatively, and take initiative in addressing challenges within their
communities or organisations.

1Gender Equality and Social Inclusion
2Socio-Emotional Learning
```

(Content Standards / Learning Indicators / Assessment table, same Sub-Strand, printed page "DESIGN AND COMMUNICATION TECHNOLOGY | 25")

```
Content Standards: 1.1.1.CS.1
Apply the understanding and techniques of concept sketches in designing.

Learning Indicators and Pedagogical Exemplars with 21st Century and GESI: 1.1.1.LI.1
Explain concept sketches and their applications in designing.

Group Work/Collaborative Learning: In mixed-ability groups present to learner's different
types of sketches. Allow learners to observe the sketches and present their findings in a whole
class discussion.

Problem-based Learning/Experiential Learning: In their groups, assist learners to research
and discuss concept sketches, types of sketches, their application in the design process, as well as
tools and materials used for sketching. Provide access to the internet, relevant videos and charts
Support learners to present their findings in a group presentation.

Assessment: 1.1.1.AS.1
Level 1 Recall
Level 2 Skills of conceptual understanding
Level 3 Strategic reasoning
Level 4 Extended critical thinking and reasoning
```

# BIOMEDICAL SCIENCE CURRICULUM FOR SECONDARY EDUCATION (SHS 1-3)

- **Source file:** curriculum-sources/BIOMEDICAL-SCIENCE-Curriculum.pdf
- **Subject:** Biomedical Science
- **Level/Form/Class coverage:** SHS 1-3 (document organises content into "YEAR ONE", "YEAR TWO", "YEAR THREE")
- **Issuing authority:** National Council for Curriculum and Assessment (NaCCA), Ministry of Education, Republic of Ghana (Ghana Education Service also credited)
- **Publication year/version:** September 2023
- **Document format:** PDF
- **Page count:** 103 pages by PDF page index; printed page-footer numbering runs to "BIOMEDICAL SCIENCE | 101" on the final content page (PDF page 103) — i.e. a consistent 2-page offset between the PDF's own index and the printed footer number (front-matter/cover pages precede the numbered footer sequence, same pattern as Physics/Robotics).
- **Apparent structure (hierarchy levels, in order, exact terminology):**
  1. "THE SHS CURRICULUM OVERVIEW" / "INTRODUCTION" (front matter, shared boilerplate across SHS subjects)
  2. "PHILOSOPHY, VISION AND GOAL OF BIOMEDICAL SCIENCE" (subject-specific: Philosophy, Vision, Goal, Contextual Issues, Rationale)
  3. "BIOMEDICAL SCIENCE CURRICULUM DEVELOPMENT PANEL" (contributor list)
  4. "SCOPE AND SEQUENCE" (summary table of Strand/Sub-Strand CS/LO/LI counts per year)
  5. "YEAR ONE" / "YEAR TWO" / "YEAR THREE" (top-level year division)
  6. "Strand" (e.g. "Strand 1. BIOMEDICAL SCIENCE IN SOCIETY")
  7. "Sub-Strand" (e.g. "Sub-Strand 1. BIOMEDICAL SCIENCE PRACTICE")
  8. "Content Standards" (table column header; body text singular "Content Standard")
  9. "Learning Outcomes" (in a separate table, paired with "21st Century Skills and Competencies" and "GESI, SEL and Shared National Values")
  10. "Learning Indicators" (inside the Content Standards table cell, under header "Learning Indicators and Pedagogical Exemplars with 21st Century Skills and Competencies, and GESI")
  11. "Assessment" (Webb's DoK Levels 1-4, one per Learning Indicator, third column of the CS table)
  - Note: same TWO-parallel-table pattern as Physics/Robotics — Table A = Learning Outcomes | 21st Century Skills and Competencies | GESI/SEL/National Values; Table B = Content Standards | Learning Indicators+Pedagogical Exemplars | Assessment. Each Content Standard block ends with a "Teaching and Learning Resources" row.
- **Curriculum code format:** `{Year}.{Strand}.{SubStrand}.{Type}.{SequenceNumber}`, e.g. `1.1.1.LO.1` (Learning Outcome, Year 1, Strand 1, Sub-Strand 1), `1.1.1.CS.1` (Content Standard), `1.1.1.LI.1` (Learning Indicator), `1.1.1.AS.1` (Assessment). Real example verified in text: `1.1.1.CS.1` / `1.1.1.LI.1` / `1.1.1.LI.2` / `1.1.1.LI.3` / `1.1.1.AS.1`-`1.1.1.AS.3` (page 25/PDF page 27, Strand 1 Sub-Strand 1). Year 3 codes begin with `3.` (e.g. `3.4.1.CS.1`, `3.4.1.LI.1` on PDF page 103).
- **Category B elements present:**
  - [x] Exemplars — header "Pedagogical Exemplars", combined into column header "Learning Indicators and Pedagogical Exemplars with 21st Century Skills and Competencies, and GESI"; named strategies embedded (e.g. "Digital Learning:", "Talk for Learning:", "Collaborative Learning:", "Problem-Based Learning:", "Structuring Talk for Learning:", "Experiential Learning:", "Initiating Talk for Learning:", "Activity-Based Learning:", "Project-Based Learning:", "Structured Talk for Learning:")
  - [x] Core Competencies — not labelled "Core Competencies" verbatim; functionally covered under header "21st Century Skills and Competencies" column (e.g. Critical Thinking, Collaboration, Communication, Leadership, Digital Literacy, Problem Solving, Ethical Reasoning)
  - [x] Values — header "GESI, SEL and Shared National Values" (footnoted "GESI¹, SEL²" on first occurrence) plus a "National Core Values:" bullet list in almost every Learning Outcome row (e.g. Tolerance, Patience, Humility, Truthfulness, Honesty)
  - [x] Pedagogical guidance — named pedagogies embedded in the Learning Indicators column, plus front-matter "Learning and Teaching Approaches" section (same boilerplate as Physics/Robotics)
  - [x] Assessment guidance — "Assessment" column citing "Level 1 Recall / Level 2 Skills of conceptual understanding / Level 3 Strategic reasoning / Level 4 Extended critical thinking and reasoning" (Webb's DoK-aligned); front matter has the same "Revised Bloom's Taxonomy and Webb's Depth of Knowledge" section
  - [x] Teaching and Learning Resources (TLR) — exact header "Teaching and Learning Resources", listed per Content Standard block (e.g. "Video", "Documentaries", "Online resources", "Glocal articles", "Reports", "Pictures", "Charts", "Textbook")
  - [x] Suggested Activities — present as bulleted sub-steps inside the Pedagogical Exemplars text, not a separately labelled column
  - [x] Cross-Cutting Themes — not a standalone header; referenced generically in the shared front matter
  - [x] GESI — exact acronym "GESI" (Gender Equality and Social Inclusion), header "Gender Equality and Social Inclusion (GESI)" in front matter, and "GESI:" sub-block per Learning Outcome row
  - [x] SEL — exact acronym "SEL" ("Social and Emotional Learning" / "Socio-Emotional Learning" — both spellings occur, footnoted as "Socio-Emotional Learning" in the table), "SEL:" sub-block per Learning Outcome
  - [x] National Values — "Shared National Values" (table header) / "National Core Values:" (per-LO bullet list)
  - [x] 21st Century Skills — exact header "21st Century Skills and Competencies", same front-matter enumeration as Physics/Robotics
- **Extraction feasibility:** COMPLETE — native digital PDF text layer, extracts cleanly and is fully searchable (verified via `pdftotext -layout`, no scanned-image content encountered). Caveats: (1) wide multi-column tables wrap awkwardly at page breaks, requiring care to reassociate wrapped rows; (2) some duplicated/interleaved footer text was observed elsewhere in this document batch (see Notes) though not on the specific pages sampled here.
- **Notes on anything unusual or differing from other subjects:** (1) Page 3 (PDF index) contains the same leftover/misplaced title block as Physics and Robotics: "PHYSICAL AND HEALTH EDUCATION CURRICULUM FOR BASIC 7 - 10 (COMMON CORE PROGRAMME) SEPTEMBER 2020" with garbled overlapping character strings (e.g. "COBMIOMMOENDCIOCRAELPSROCGIERNACMME E") — an apparent copy-paste/template artifact from another subject's front matter, confirming this is a shared production template across the SHS PDF batch. (2) Scope and Sequence table (PDF page 23, printed "BIOMEDICAL SCIENCE | 21") gives clean overall totals: 22 Content Standards, 22 Learning Outcomes, 69 Learning Indicators across SHS 1-3 — this table extracted more cleanly than the equivalent tables in Biology/Chemistry (see those files' notes). (3) Structurally near-identical to Physics/Robotics in table layout and boilerplate; only 4 Strands (Biomedical Science in Society; Human Body Systems; Biomedical Intervention; Biomedical Innovations/Innovation — note the Contents page itself is inconsistent between "Innovations" (Year 1 heading) and "Innovation" (Year 2/3 heading and body text), an apparent source typo/inconsistency, not a transcription error here.

## Representative verbatim sample

Source: page(s) 23 (printed page number "BIOMEDICAL SCIENCE | 23"; PDF page index 25), 25 (printed "BIOMEDICAL SCIENCE | 25"; PDF page index 27)

```
Subject     BIOMEDICAL SCIENCE
Strand      1. BIOMEDICAL SCIENCE IN SOCIETY
Sub-Strand  1. BIOMEDICAL SCIENCE PRACTICE

Learning Outcomes                       21st Century Skills and Competencies
1.1.1.LO.1
Describe what biomedical                Critical Thinking:
science is and how scientific           • As learners watch videos and interact with other learners, they
investigation is applied in                 critically observe, analyse and relate the roles biomedical scientists
biomedical science.                         play in their environment to what was observed in the videos.
                                         • As learners research on the various ways of solving problems related
                                             to biomedical science, they critically apply the knowledge to
                                             biomedical science problems in society.

                                         Collaboration:
                                         • Learners work in mixed-ability groups and relate their observations to
                                             peers, brainstorm and come out with agreed answers. Learners learn
                                             to accept constructive feedback from peers.
```

```
Content Standards    Learning Indicators and Pedagogical Exemplars with 21st Century Skills and
                     Competencies, and GESI                                                                           Assessment
1.1.1.CS.1           1.1.1.LI.1                                                                                       1.1.1.AS.1
Demonstrate an       Explain what biomedical science is and what it is not.                                           Level 1 Recall
understanding of                                                                                                      Level 2 Skills of
Biomedical Science.  Digital Learning: Watch videos and pictures of biomedical scientists in practice as well as the  conceptual
                     products of biomedical science.                                                                  understanding
                                                                                                                       Level 3 Strategic
                     Talk for Learning: Through a whole class session, discuss observations made and relate them to   reasoning
                     personal experiences with biomedical scientists and/or products of biomedical science.           Level 4 Extended critical
                                                                                                                       thinking
                     Collaborative Learning: Through think-pair-share, identify the key features of biomedical science    and reasoning
                     as a field of study and outline some misconceptions about the subject.
```

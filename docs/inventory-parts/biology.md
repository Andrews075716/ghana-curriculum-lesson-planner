# BIOLOGY CURRICULUM FOR SECONDARY EDUCATION (SHS 1-3)

- **Source file:** curriculum-sources/Biology-Curriculum.pdf
- **Subject:** Biology
- **Level/Form/Class coverage:** SHS 1-3 (document organises content into "YEAR ONE", "YEAR TWO", "YEAR THREE")
- **Issuing authority:** National Council for Curriculum and Assessment (NaCCA), Ministry of Education, Republic of Ghana (Ghana Education Service also credited)
- **Publication year/version:** September 2023
- **Document format:** PDF
- **Page count:** 120 pages by PDF page index; printed page-footer numbering runs to "118 | BIOLOGY" on the final content page (PDF page 120) — a consistent 2-page offset between the PDF's own index and the printed footer number, same pattern as Physics/Robotics/Biomedical Science.
- **Apparent structure (hierarchy levels, in order, exact terminology):**
  1. "THE SHS CURRICULUM OVERVIEW" / "INTRODUCTION" (front matter, shared boilerplate across SHS subjects)
  2. "PHILOSOPHY, VISION AND GOAL OF BIOLOGY" (subject-specific: Philosophy, Vision, Goal, Contextual Issues, Rationale)
  3. "BIOLOGY CURRICULUM DEVELOPMENT PANEL" (contributor list)
  4. "SCOPE AND SEQUENCE" (summary table of Strand/Sub-Strand CS/LO/LI counts per year)
  5. "YEAR ONE" / "YEAR TWO" / "YEAR THREE" (top-level year division)
  6. "Strand" (e.g. "Strand 1. EXPLORING BIOLOGY IN SOCIETY")
  7. "Sub-Strand" (e.g. "Sub-Strand 1. BIOLOGY AS THE SCIENCE OF LIFE")
  8. "Content Standards" (table column header)
  9. "Learning Outcomes" (separate table, paired with "21st Century Skills and Competencies" and "GESI, SEL and Shared National Values")
  10. "Learning Indicators" (inside the Content Standards table cell, under header "Learning Indicators and Pedagogical Exemplars with 21st Century Skills and Competencies, and GESI")
  11. "Assessment" (Webb's DoK Levels 1-4, one per Learning Indicator)
  - Same two-parallel-table pattern as other subjects in this batch, each Content Standard block ending with a "Teaching and Learning Resources" row.
  - Difference from Biomedical Science/Physics samples checked: a single Sub-Strand can carry MULTIPLE Content Standards in sequence (e.g. `1.1.1.CS.1` and `1.1.1.CS.2` both appear under Sub-Strand 1.1.1, each with its own LI/Assessment set), and a single Sub-Strand's Learning Outcomes table can likewise carry several Learning Outcomes (observed `1.1.1.LO.1` through `1.1.1.LO.4` under one Sub-Strand).
- **Curriculum code format:** `{Year}.{Strand}.{SubStrand}.{Type}.{SequenceNumber}`, e.g. `1.1.1.LO.1`-`1.1.1.LO.4` (Learning Outcomes), `1.1.1.CS.1`, `1.1.1.CS.2` (Content Standards), `1.1.1.LI.1` (Learning Indicator), `1.1.1.AS.1` (Assessment) — all verified on PDF pages 26-30 (printed "BIOLOGY | 23"-"28 | BIOLOGY"). Year 3 codes begin with `3.` (e.g. `3.4.2.CS.1`, `3.4.2.LI.1`-`3.4.2.LI.3`, verified PDF pages 118-120).
- **Category B elements present:**
  - [x] Exemplars — header "Pedagogical Exemplars" (combined column header "Learning Indicators and Pedagogical Exemplars with 21st Century Skills and Competencies, and GESI"); named strategies embedded (e.g. "Talk for Learning (TFL):", "Think-Pair-Share:", "Enquiry-Based Approach:", "Group Presentation:", "Individual-based Learning:", "Collaborative Learning Approach:", "Experiential Learning Approach:", "Differential Task-Based Learning:", "Individual Project-Based Learning Approach:")
  - [x] Core Competencies — not labelled "Core Competencies" verbatim; covered under column header "21stCentury Skills and Competencies" (no space before "Century" in this document's table header — an apparent typographic inconsistency vs. other subjects' "21st Century Skills and Competencies"), enumerating Communication and Collaboration, Critical Thinking and Problem-Solving Skills, Digital Literacy skills, Cultural Identity and Global Citizenship, Creativity and Innovation, Leadership and Personal Development, Personal Development
  - [x] Values — header "GESI, SEL and Shared National Values" (footnoted "GESI¹, SEL²" on first occurrence); "National Core Values:" bullet list per Learning Outcome row (e.g. Respect for each member of the group, Integrity and honesty, Selflessness and perseverance, Time consciousness and commitment to achieving excellence)
  - [x] Pedagogical guidance — named pedagogies embedded in Learning Indicators, plus the shared front-matter "Learning and Teaching Approaches" section
  - [x] Assessment guidance — "Assessment" column citing the same "Level 1 Recall / Level 2 Skills of conceptual understanding / Level 3 Strategic reasoning / Level 4 Extended critical thinking and reasoning" Webb's DoK levels; same shared front-matter Bloom's/DoK section
  - [x] Teaching and Learning Resources (TLR) — exact header "Teaching and Learning Resources", listed per Content Standard block (e.g. "Computer/projectors/TV/smart phone", "Pen drive", "Pictures", "Dry fish (\"Kobi\")", "Honey", "Bottled fruit juices", "Milk", "Medicines")
  - [x] Suggested Activities — embedded as bulleted sub-steps inside the Pedagogical Exemplars text, not a standalone column
  - [x] Cross-Cutting Themes — not a standalone header; generic reference only in the shared front matter
  - [x] GESI — exact acronym "GESI" (Gender Equality and Social Inclusion), front-matter header "Gender Equality and Social Inclusion (GESI)" plus "GESI:" sub-block per Learning Outcome
  - [x] SEL — exact acronym "SEL"; front-matter header "Social Emotional Learning (SEL): Five Core Competencies with..." plus "SEL:" sub-block per Learning Outcome
  - [x] National Values — "Shared National Values" (table header) / "National Core Values:" (per-LO bullet list)
  - [x] 21st Century Skills — front-matter header "21st Century Skills and Competencies" (with normal spacing, unlike the table-header variant noted above)
- **Extraction feasibility:** PARTIAL — the text layer is native and searchable (not scanned), but the "SCOPE AND SEQUENCE" summary table (PDF page 23) extracted with visibly scrambled column/row alignment (numeric CS/LO/LI cell values do not line up under their intended Strand/Sub-Strand row labels in the raw `pdftotext -layout` output, and two different printed page-footer numbers — "BIOLOGY | 19" and "BIOLOGY | 23" — appear stacked on the same extracted page, an apparent overlapping-text-layer artifact also seen on this document's page 4, which shows "2 | BIOLOGY" printed twice). The overall totals row (Content Standards 41, Learning Outcomes 42, Learning Indicators 80) is legible and trustworthy, but the per-Strand/Sub-Strand breakdown numbers in that table should not be trusted without visual/manual verification against the source PDF. The main content tables (Learning Outcomes / Content Standards / Learning Indicators / Assessment) extract cleanly.
- **Notes on anything unusual or differing from other subjects:** (1) Page 3 (PDF index) again contains the same leftover "PHYSICAL AND HEALTH EDUCATION CURRICULUM FOR BASIC 7 - 10 (COMMON CORE PROGRAMME)" title-block artifact with garbled overlapping text (e.g. "COMMONBCIOORLEOPGRYOGRAMME"), confirming the shared production template across this SHS PDF batch. (2) This document shows more duplicated/overlapping footer text than Biomedical Science or the Physics/Robotics examples (see Extraction feasibility above) — worth flagging for the extraction pipeline to de-duplicate rather than trust blindly. (3) Multiple Content Standards per Sub-Strand (e.g. `1.1.1.CS.1`, `1.1.1.CS.2`) is more pronounced here than in the other sampled documents — automated extraction logic should not assume exactly one Content Standard per Sub-Strand.

## Representative verbatim sample

Source: page(s) 23 (printed "BIOLOGY | 23"; PDF page index 26), 27 (printed "BIOLOGY | 27"; PDF page index 29)

```
YEAR ONE
Subject     BIOLOGY
Strand      1. EXPLORING BIOLOGY IN SOCIETY
Sub-Strand  1. BIOLOGY AS THE SCIENCE OF LIFE

Learning Outcomes              21stCentury Skills and Competencies                             GESI1, SEL2 and Shared National Values
1.1.1.LO.1
Explain the importance of      Communication and Collaboration: Learners speak                 GESI:
Biology and its branches and   politely and clearly as they share ideas on the video and       • Respect individuals of different beliefs, religions, and
relate this to everyday life.  pictures they watched with their peers and accept constructive
                               feedback from their peers.                                          cultures.
                                                                                               • Embrace diversity and practise inclusion.
```

```
Content Standards          Learning Indicators and Pedagogical Exemplars with 21st Century Skills and
                           Competencies, and GESI                                                                                       Assessment
1.1.1.CS.1                 1.1.1.LI.1                                                                                                 1.1.1.AS.1
Demonstrate knowledge      Observe and discuss the importance of Biology, its various branches and their applications                 Level 1 Recall
and understanding of       in everyday life.                                                                                          Level 2 Skills of
Biology, the various                                                                                                                  conceptual
branches and fields of     Talk for Learning (TFL): in mixed ability, gender-balanced groups, observe pictures, videos of             understanding
study, and their benefits  specimens relating to Biology (e.g., honey and dry Tilapia, etc.) and share ideas with peers and accept    Level 3 Strategic
in everyday life.          feedback on their observations: Learners in mixed-ability groups learn from each other and provide         reasoning
                           emotional support to one another to achieve targets.                                                       Level 4 Extended
                                                                                                                                      critical thinking
                           Think-Pair-Share: learners in pairs discuss, analyse and share the contribution of biologists to the       and reasoning
                           development of society; learners speak to each other to improve on communication.
```

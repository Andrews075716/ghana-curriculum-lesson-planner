# ROBOTICS CURRICULUM FOR SECONDARY EDUCATION (SHS 1-3)

- **Source file:** curriculum-sources/ROBOTICS-Curriculum.pdf
- **Subject:** Robotics
- **Level/Form/Class coverage:** SHS 1-3 (Senior High School, referred to internally as "Year One", "Year Two", "Year Three")
- **Issuing authority:** National Council for Curriculum and Assessment (NaCCA), Ministry of Education, Republic of Ghana (Ghana Education Service also credited in acknowledgements)
- **Publication year/version:** September 2023
- **Document format:** PDF
- **Page count:** 170 (internal PDF page index runs to 170; the document's own printed page-number footer on the final content page reads "168 | ROBOTICS" — the ~2-page offset is front-matter/cover pages that precede the numbered footer sequence)
- **Apparent structure (hierarchy levels, in order, exact terminology):**
  1. "THE SHS CURRICULUM OVERVIEW" / "INTRODUCTION" (front matter, shared boilerplate across SHS subjects)
  2. "PHILOSOPHY, VISION AND GOAL OF ROBOTICS" (subject-specific)
  3. "SCOPE AND SEQUENCE" (summary table of Strand/Sub-Strand counts per year)
  4. "YEAR ONE" / "YEAR TWO" / "YEAR THREE" (top-level year/grade division, printed as full-page section dividers)
  5. "Strand" (e.g. "Strand 1. Principles of Robotic Systems") — labelled in-table as "STRAND"
  6. "Sub-Strand" (e.g. "Sub-Strand 1. Robots & Society") — labelled in-table as "SUB-STRAND"
  7. "Content Standards" (labelled "Content Standard" singular in body text, "Content Standards" as table column header)
  8. "Learning Outcomes" (appears in a separate table paired with "21st Century Skills and Competencies" and "GESI, SEL and Shared National Values")
  9. "Learning Indicators" (appear inside the same table cell as, and directly under, each Content Standard, paired with "Pedagogical Exemplars")
  10. "Assessment" (Webb's DoK levels 1-4, listed per Learning Indicator, in the third column of the Content Standard table)
  - Note: the document presents TWO parallel/linked tables per Sub-Strand: Table A = "Learning Outcomes | 21st Century Skills and Competencies | GESI, SEL and Shared National Values"; Table B = "Content Standards | Learning Indicators and Pedagogical Exemplars with 21st Century Skills and Competencies, and GESI | Assessment". Learning Outcomes and Content Standards are numbered independently but share the same leading code prefix (e.g. both under 1.1.1) and appear to correspond loosely rather than 1:1.
- **Curriculum code format:** Composite dotted codes of the form `<Year>.<Strand>.<SubStrand>.<Type>.<Number>`, e.g. `1.1.1.LO.1` (Year 1, Strand 1, Sub-Strand 1, Learning Outcome 1), `1.1.1.CS.1` (Content Standard), `1.1.1.LI.1` (Learning Indicator), `1.1.1.AS.1` (Assessment item). Year 2 and Year 3 codes begin with `2.` and `3.` respectively (e.g. `2.1.1.LO.1`, `3.1.2.CS.1`). This differs from the "B7.1.1.1" JHS-style code format — there is no subject-letter/grade-number prefix like "B7"; instead the leading digit is the SHS year number (1/2/3).
- **Category B elements present:**
  - Exemplars: YES — "Pedagogical Exemplars" embedded directly in the Learning Indicator column (e.g. "Experiential Learning:", "Problem-Based Learning:", "Project-Based Learning:", "Talk for Learning:", "Diamond Nine:", "Think-Pair-Share:" as named strategies with worked descriptions)
  - Core Competencies: YES — header "21st Century Skills and Competencies" (own table column, itemised per Learning Outcome: Critical Thinking, Collaboration, Communication, Leadership, Media Literacy, Information Literacy, Technology Literacy, etc.)
  - Values: YES — "National Core Values" (e.g. Tolerance, Friendliness, Open-mindedness, Patience, Hard work, Humility) and "Truth and Integrity" callouts, under the combined header "GESI, SEL and Shared National Values"
  - Pedagogical guidance: YES — large front-matter sections "Learning and Teaching Approaches", "Universal Design for Learning (UDL) in the SHS Curriculum", plus named pedagogies embedded in Learning Indicators
  - Assessment guidance: YES — front matter "Curriculum and Assessment Design: Revised Bloom's Taxonomy and Webb's Depth of Knowledge"; per-item "Assessment" column listing "Level 1 Recall / Level 2 Skills of conceptual understanding / Level 3 Strategic reasoning / Level 4 Extended critical thinking and reasoning" (some items bold one level to indicate the target level; a few items carry a fully custom assessment task description instead of the four generic DoK levels, e.g. 1.3.3.AS.1 and 3.1.2 items)
  - TLR (Teaching and Learning Resources): YES — explicit header "Teaching and Learning Resources", a dedicated row/column per Content Standard block listing concrete materials (e.g. "Video Documentaries", "Sensors", "Robotic Kits", "Screwdrivers", "3D CAD software")
  - Suggested Activities: YES, but not a separate header — activities are embedded as sub-bullets inside each named pedagogical strategy in the Learning Indicator cell (no standalone "Suggested Activities" section)
  - Cross-Cutting Themes: Not a standalone header — 21st Century Skills/GESI/SEL/National Values collectively serve this role and are called "cross-cutting themes" once in the front-matter "THE SHS CURRICULUM OVERVIEW" prose
  - GESI: YES — explicit header "Gender Equality and Social Inclusion (GESI)" in front matter (page 9) and recurring column header "GESI, SEL and Shared National Values" / inline "GESI:" callouts throughout every Learning Outcome row
  - SEL: YES — explicit header "Social Emotional Learning (SEL): Five Core Competencies with Examples" in front matter (pages 11-12: Self-Awareness, Self-Management, Social Awareness, Relationship Skills, Responsible Decision-Making) and inline "SEL:" callouts per Learning Outcome
  - National Values: YES — "National Core Values" list appears per Learning Outcome, plus the SHS-wide "shared Ghanaian values" mentioned in the overview
  - 21st Century Skills: YES — explicit header "21st Century Skills and Competencies" in front matter (page 9), enumerating Critical Thinking and Problem-Solving, Creativity, Collaboration, Communication, Learning for Life, Global and Local (Glocal) Citizenship, Systems Thinking, Normative, Anticipatory, Strategic, Self-Awareness competencies; also a per-row table column of the same name
- **Extraction feasibility:** COMPLETE — text extracts cleanly (native PDF text layer, not scanned images); however tables are wide/multi-column (Content Standards | Learning Indicators+Pedagogical Exemplars+21st Century Skills+GESI | Assessment) and text wraps awkwardly across page breaks in extraction (e.g. GESI bullet lists get split mid-sentence across pages), so automated table-cell parsing will need care to reassociate wrapped rows correctly.
- **Notes on anything unusual or differing from other subjects:** (1) Front matter (pages 3-20) is near-identical generic "SHS Curriculum Overview" boilerplate likely shared verbatim across all SHS subject PDFs in this batch (21st Century Skills, GESI, SEL, Bloom's/DoK framework, Definition of Key Terms) — worth deduplicating rather than re-extracting per subject. (2) Page 3 of this specific PDF file contains a leftover/misplaced title block reading "PHYSICAL AND HEALTH EDUCATION CURRICULUM FOR BASIC 7 – 10 (COMMON CORE PROGRAMME) SEPTEMBER 2020" — an apparent copy-paste artifact from another subject's front-matter template; the rest of the document is consistently Robotics-specific. (3) Year 3 coverage is a subset of Year 1/2 (Strand 2 Sub-Strand 2 "Tools & Apps for Robot Design" and Strand 3 Sub-Strand 3 "Programming Robots" have no Year 3 rows in the Scope and Sequence table, and Year 3's Strand 3 Sub-Strand 2 is explicitly labelled "Final Year project" expecting a capstone functional robotic prototype). (4) The "Assessment" column mostly repeats a generic 4-level DoK list rather than a bespoke assessment item per Learning Indicator, except in later/advanced Learning Indicators where a specific task ("Write and test computer programs progressively...") replaces the generic list. (5) Scope and Sequence table give exact totals: Content Standards 36, Learning Outcomes 36, Learning Indicators 63, across SHS 1-3.

## Representative verbatim sample

Source: page(s) 23, 27 (Strand 1 / Sub-Strand 1, Year One)

Subject: ROBOTICS
Strand 1. Principles of Robotic Systems
Sub-Strand 1. Robots & Society

Learning Outcome 1.1.1.LO.1:
"Appraise the peculiar characteristics of the various industrial revolutions and critically analyse the impact of performance on human-robot coexistence in working environments."

Content Standard 1.1.1.CS.1:
"Demonstrate understanding of the role of robots as socio-technical systems."

Learning Indicator 1.1.1.LI.1:
"Describe the distinct features and advancements that characterise the transition from each of the industrial revolutions."

Pedagogical Exemplars (under 1.1.1.LI.1):
"Experiential Learning: Watch videos on the various industrial revolutions, document personal observations, and share them with the class. Learners comment on shared observations.
Collaborative Learning: Sit in groups and discuss learner observations on the peculiarities of each revolution and the transitions. Groups classify various machines under the identified industrial revolutions. Structure learners' contributions using a flowchart to reflect features of various phases of transition.
Illustrate with a chart"

Assessment 1.1.1.AS.1:
"Level 1 Recall
Level 2 Skills of conceptual understanding
Level 3 Strategic reasoning
Level 4 Extended critical thinking and reasoning"

Teaching and Learning Resources: "Video Documentaries", "Charts", "Articles", "Narratives", "Reports", "Pictures/videos of simple physical machines"

# AVIATION AND AEROSPACE ENGINEERING CURRICULUM FOR SECONDARY EDUCATION (SHS 1-3)

- **Source file:** curriculum-sources/Aviation-and-Aerospace-Engineering-Curriculum.pdf
- **Subject:** Aviation and Aerospace Engineering
- **Level/Form/Class coverage:** SHS 1-3 (document organises content into "YEAR ONE", "YEAR TWO", "YEAR THREE")
- **Issuing authority:** National Council for Curriculum and Assessment (NaCCA), Ministry of Education, Republic of Ghana (Ghana Education Service also credited on the cover/title pages)
- **Publication year/version:** September 2023
- **Document format:** PDF
- **Page count:** 126 pages by PDF page index (counted via form-feed/page-break count from `pdftotext`); the printed page-number footer on the final content page reads "124 | AVIATION AND AEROSPACE ENGINEERING" — a consistent ~2-page offset between PDF index and printed footer, same pattern as Physics and Robotics (front cover/legal pages precede the numbered footer sequence).
- **Apparent structure (hierarchy levels, in order, exact terminology):**
  1. "THE SHS CURRICULUM OVERVIEW" / "INTRODUCTION" (front matter, shared boilerplate across SHS subjects — Philosophy/Vision/Goal of SHS Curriculum, GESI, 21st Century Skills and Competencies, Definition of Key Terms, Bloom's/DoK assessment framework)
  2. "PHILOSOPHY, VISION AND GOAL OF AVIATION AND AEROSPACE ENGINEERING" (subject-specific: Philosophy, Vision, Goal, Rationale, Contextual Issues)
  3. "AVIATION AND AEROSPACE ENGINEERING CURRICULUM DEVELOPMENT PANEL" (writers/reviewers list)
  4. "SCOPE AND SEQUENCE" (summary table, header "Aviation and Aerospace Engineering Summary", giving per-Sub-Strand CS/LO/LI counts by year)
  5. "YEAR ONE" / "YEAR TWO" / "YEAR THREE" (top-level year division, printed as section dividers)
  6. "Strand" (e.g. "Strand 1 Core Concepts in Aerospace Engineering") — printed in-table as "Strand"
  7. "Sub-Strand" (e.g. "Sub-Strand 1 Fundamentals of Flight") — printed in-table as "Sub-Strand"
  8. "Learning Outcomes" (own table, paired with "21st Century Skills and Competencies" and "GESI, SEL and Shared National Values" columns)
  9. "Content Standards" (own table, e.g. "1.1.1.CS.1")
  10. "Learning Indicators and Pedagogical Exemplars with 21st Century Skills and Competencies, and GESI" (single combined column, e.g. "1.1.1.LI.1")
  11. "Assessment" (Webb's DoK levels 1-4, listed per Learning Indicator, in the third column of the Content Standard table)
  - Note: as in Physics/Robotics, TWO parallel tables per Sub-Strand: Table A = "Learning Outcomes | 21st Century Skills and Competencies | GESI, SEL and Shared National Values"; Table B = "Content Standards | Learning Indicators and Pedagogical Exemplars with 21st Century Skills and Competencies, and GESI | Assessment". Each Content Standard block also carries an embedded "Teaching and Learning Resources" list (no separate column header — appears as a left-margin label under the Content Standard text).
- **Curriculum code format:** `<Year>.<Strand>.<SubStrand>.<Type>.<Number>`, e.g. `1.1.1.LO.1` (Year 1, Strand 1, Sub-Strand 1, Learning Outcome 1), `1.1.1.CS.1` (Content Standard), `1.1.1.LI.1` (Learning Indicator), `1.1.1.AS.1` (Assessment). Same format family as Physics and Robotics (leading digit = SHS year 1/2/3, not a "B7"-style JHS prefix). Within one Content Standard block, Learning Indicators and their paired Assessment codes restart numbering at `.LI.1`/`.AS.1` (e.g. `1.1.1.CS.1` → `1.1.1.LI.1`, `1.1.1.LI.2`; `1.1.1.CS.2` → `1.1.1.LI.1`, `1.1.1.LI.2` again), so LI/AS codes are only unique when read together with their parent Content Standard code, not globally unique — this repetition is visible directly in the sample read (see below).
- **Category B elements present:**
  - [x] Exemplars — header "Pedagogical Exemplars", combined into column header "Learning Indicators and Pedagogical Exemplars with 21st Century Skills and Competencies, and GESI"; named strategies embedded (e.g. "Collaborative Learning:", "Building on What Others Say:", "Experiential Learning:", "Project-Based Learning:", "Problem-Based Learning:", "Talk for Learning:")
  - [x] Core Competencies — not labelled "Core Competencies" verbatim in the tables; covered functionally under column header "21st Century Skills and Competencies" (front matter also uses "competencies" generically)
  - [x] Values — header "GESI, SEL and Shared National Values" (LO table) plus an inline "National Core Values" bullet list in each Learning Outcome row (e.g. Tolerance, Friendliness, Open-mindedness, Patience, Hard work, Humility) and "Truth and Integrity" callouts
  - [x] Pedagogical guidance — named pedagogies embedded in the Learning Indicators column, plus front-matter sections "THE SHS CURRICULUM OVERVIEW"/"INTRODUCTION" covering teaching and learning approaches
  - [x] Assessment guidance — "Assessment" column citing "Level 1 Recall / Level 2 Skills of conceptual understanding / Level 3 Strategic reasoning / Level 4 Extended critical thinking and reasoning" (Webb's DoK-aligned); front matter has a full section on Bloom's Taxonomy/DoK and SEAG/NPLAF assessment strategy
  - [x] Teaching and Learning Resources (TLR) — exact label "Teaching and Learning Resources", appears as a left-margin heading under each Content Standard, followed by a bulleted list of concrete materials (e.g. "A kite", "A toy bird", "Documentaries about the evolution of flight")
  - [x] Suggested Activities — present as bulleted sub-steps inside the named Pedagogical Exemplars text (not a separately labelled column)
  - [x] Cross-Cutting Themes — not a standalone header; referenced generically in front matter ("guidance on pedagogy, coupled with exemplars, demonstrating how to integrate cross-cutting themes such as 21st Century skills, core competencies, the use of ICT, literacy and mathematics, Social Emotional Learning, Gender Equality and Social Inclusion")
  - [x] GESI — exact acronym "GESI" (Gender Equality and Social Inclusion), defined in front matter ("Gender Equality and Social Inclusion (GESI)" section heading) and appears as inline "GESI:" sub-block per Learning Outcome row; the LO-table column header is printed "GESI1, SEL2 and Shared National Values" with superscript footnote markers 1/2 in the extracted text (footnote text itself was not captured in the pages read)
  - [x] SEL — exact acronym "SEL" appears as inline "SEL:" sub-block per Learning Outcome; front matter defines SEL generically (not independently re-verified against the pages read for this subject, but the "GESI1, SEL2" column header format matches Physics/Robotics)
  - [x] National Values — "Shared National Values" (column header) / "National Core Values" (per-LO bullet list)
  - [x] 21st Century Skills — exact header "21st Century Skills and Competencies", both as a front-matter section and a per-row table column, enumerating Critical Thinking and Problem-Solving, Creativity, Collaboration, Communication, Learning for Life, and (per the LO table samples) Information Literacy, Technology Literacy, Social Skills, Observation Skills, Critical Thinking
- **Extraction feasibility:** COMPLETE — text layer extracts cleanly via `pdftotext` (native digital PDF, not scanned); `pdftoppm`/`pdfinfo` were unavailable in this environment so `pdftotext -layout` was used directly instead of the Read tool's page-rendering path. Caveats: (1) tables are wide multi-column layouts and `-layout` extraction interleaves/wraps text awkwardly across the Content-Standard / Learning-Indicator / Assessment columns, and across page breaks (e.g. printed footers land mid-paragraph, "GESI:" bullet text gets split across pages); (2) a handful of bullet-point glyphs render as garbled control characters in raw extraction (e.g. a line reading `'^Z/Z` / `^ZZZZ>` in the Learning Outcome 1.1.1.LO.1 GESI block, printed page 23) — likely a special bullet/icon font not mapping to a Unicode code point; (3) the GESI/SEL boilerplate text per Learning Outcome is near-identical to Physics/Robotics but in places references "home management and human development" (a Home Economics-style stock paragraph), which appears to be copy-pasted boilerplate not rewritten for this subject — see Notes.
- **Notes on anything unusual or differing from other subjects:** (1) Same front-matter copy/paste artifact pattern as Physics and Robotics: the cover-page area (PDF pages 1-2, printed pages 1-2 before the "2 | AVIATION AND AEROSPACE ENGINEERING" foreword) contains a garbled, overlapping title block that includes the text "PHYSICAL AND HEALRTEPUHBLICEODF GUHACNAATION CURRICULUM FOR BASIC 7 - 10 (COMMON CORE PROGRAMME)" interleaved character-by-character with the correct Aviation and Aerospace Engineering title — an apparent PDF-layer/OCR artifact from reusing another subject's cover template, consistent with the leaked "PHYSICAL AND HEALTH EDUCATION..." fragment seen in Physics and Robotics. (2) The "GESI, SEL and Shared National Values" boilerplate text under several Year One Learning Outcomes (1.1.1.LO.1, 1.1.1.LO.2) reads "...examine and dispel misconceptions/myths about gender as they relate home management and human development" and "...recognition of the contributions of different groups and individuals to the effective management and maintenance of the home" — content that reads as though copied from a Home Economics curriculum's stock GESI/SEL paragraph rather than written specifically for Aviation and Aerospace Engineering; this stock text repeats verbatim (or near-verbatim) across multiple Learning Outcomes in the pages sampled. (3) Content Standard blocks each restart Learning Indicator/Assessment numbering at `.LI.1`/`.AS.1` (see Curriculum code format note above) rather than continuing a running count within the Sub-Strand — same convention observed in Physics/Robotics. (4) The Scope and Sequence summary table ("Aviation and Aerospace Engineering Summary", printed page 20-21) gives overall totals: 28 Content Standards, 28 Learning Outcomes, 61 Learning Indicators across SHS 1-3 (Year 1: 9 CS/9 LO/20 LI; Year 2: 8 CS/8 LO/18 LI; Year 3: 11 CS/11 LO/23 LI) — the table's per-cell layout is dense and column alignment degrades in raw text extraction (numbers run together, e.g. "3 36" for CS=3/LO=3/LI=6), so these totals were read from the explicit "Overall Totals (SHS 1-3)" summary block at the bottom of the same page rather than by summing the dense per-row cells. (5) `pdftoppm`/`pdfinfo` (poppler-utils image/page tools) were not installed in this environment, so the Read tool's `pages` parameter (which depends on `pdftoppm`) failed; `pdftotext -f <start> -l <end> -layout` was used instead to extract the same page ranges as plain text, staying within the same "few large reads" budget.
- **Documents differing from other subjects observed so far (Physics, Robotics):** structure, code format, and Category B element set are all consistent with Physics and Robotics; the main differences are (a) the apparently mismatched/copy-pasted Home-Economics-flavoured GESI/SEL boilerplate text noted above, and (b) the front-matter cover-page title garbling referencing Physical and Health Education rather than a different subject in the physics case (physics leaked the same PHE title, so this may be a shared corrupted cover template across the whole batch rather than subject-specific).

## Representative verbatim sample

Source: page(s) 22-23 (printed page "22 | AVIATION AND AEROSPACE ENGINEERING" / "AVIATION AND AEROSPACE ENGINEERING | 23"; PDF page index ~24, Year One / Strand 1 / Sub-Strand 1)

```
Subject       Aviation and Aerospace Engineering
Strand 1      Core Concepts in Aerospace Engineering
Sub-Strand 1  Fundamentals of Flight

Learning Outcomes
1.1.1.LO.1
Explain the key stages characterising the evolution of flight from its inception to
the advent of powered, controlled flight.

21st Century Skills and Competencies
Information Literacy: By discussing the history of flight, students are
exposed to the important players and events that heralded the
development of flight vehicles.

Communication/Social Skills/Collaboration: As students work in
groups, they share ideas among themselves, taking turns both to speak
and listen to their peers.

GESI, SEL and Shared National Values
GESI: Learners having experienced a teaching approach that ensures gender
equality and inclusion, where they work with each other in an inclusive way;
cross-sharing knowledge and understanding among groups and individuals lead
them to:
 respect individuals of different backgrounds.
 embrace diversity and practice inclusion.
 examine and dispel misconceptions/myths about gender as they relate
   home management and human development.
 interrogate their stereotypes and biases about gender and the role men
   and women play in home management.
 identify injustice, especially in recognition of the contributions of
   different groups and individuals to the effective management and
   maintenance of the home.
 be sensitive to the inter-relatedness of the various aspects of life.
 value and promote justice at home and in society.

National Core Values:
 Tolerance
 Friendliness
 Open-mindedness
 Patience
 Hard work
 Humility
```

(Content Standards / Learning Indicators / Assessment table, same Sub-Strand, printed page "AVIATION AND AEROSPACE ENGINEERING | 27")

```
Content Standards: 1.1.1.CS.1
Demonstrate knowledge and understanding of the evolution of flight.

Teaching and Learning Resources

Learning Indicators and Pedagogical Exemplars with 21st Century Skills and Competencies, and GESI: 1.1.1.LI.1
Trace the evolution of flight prior to powered and controlled flight.

Collaborative Learning: In a class discussion, explore learners' experiences with flying objects
(balloons, kites, paper aeroplanes) and birds, with the aid of relevant resources.

Building on What Others Say: Brainstorm and build on what others say about humans' attempt to
fly like birds; using lighter-than-air- balloons and kites. Organise thoughts using webbing or concept
maps.

Experiential Learning/Collaborative Learning:
With the aid of a video documentary, textbooks, webpages or any other relevant sources, work in
small mixed ability groups to develop posters or Powerpoint presentations on the various phases
or stages of flight development.
Encourage all learners to participate, respect and tolerate the views of all learners whilst working in
groups or in pairs.

Assessment: 1.1.1.AS.1
Level 1 Recall
Level 2 Skills of conceptual understanding
Level 3 Strategic reasoning
Level 4 Extended critical thinking and reasoning

[Resources for this Content Standard block: A kite / A toy bird / A toy airplane / A balloon / Legos /
Documentaries about the evolution of flight / A paper/toy airplane / A toy airplane / Documentaries
about the development of powered and controlled flight]
```

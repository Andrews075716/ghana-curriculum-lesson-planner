# HISTORY CURRICULUM FOR SECONDARY EDUCATION (SHS 1-3)

- **Source file:** curriculum-sources/History-Curriculum.pdf
- **Subject:** History
- **Level/Form/Class coverage:** SHS 1-3 (document organises content into "YEAR ONE", "YEAR TWO", "YEAR THREE")
- **Issuing authority:** National Council for Curriculum and Assessment (NaCCA), Ministry of Education, Republic of Ghana (in association with Ghana Education Service)
- **Publication year/version:** September 2023
- **Document format:** PDF
- **Page count:** 137 pages (PDF page index; text-layer extraction tooling reported 137 pages). The last content page's printed footer reads "134 | HISTORY" (PDF index page 136), with PDF page 137 being a blank trailing page — i.e. an offset of roughly 2-3 pages between the printed page-number footer and the PDF's own page index, consistent with the pattern seen in Physics/Robotics.
- **Apparent structure (hierarchy levels, in order, exact terminology):**
  1. **Strand** (e.g. "Strand 1 Historical Inquiry And Writing")
  2. **Sub-Strand** (e.g. "Sub-Strand 1 Nature And Scope Of History")
  3. **Content Standards** (e.g. "1.1.1CS.1" — see code-format note below)
  4. **Learning Outcomes** (e.g. "1.1.1.LO.1") — listed in a separate table above/alongside the Content Standards table, paired with "21st Century Skills and Competencies" and "GESI, SEL and Shared National Values" columns
  5. **Learning Indicators** (e.g. "1.1.1.LI.1") — presented together with **Pedagogical Exemplars** in one combined column, headed "Learning Indicators and Pedagogical Exemplars with 21st Century Skills and Competencies, and GESI"
  6. **Assessment** entries tied to each Learning Indicator (e.g. "1.1.1.AS.1"), using the same four-level Webb's DoK list as Physics/Robotics
  - Each Content Standard block ends with a "Teaching and Learning Resources" section (e.g. p.136, listing items such as "Photographs of European settlement patterns in Africa", "Primary sources", "Internet access").
  - History-specific addition not seen in Physics/Robotics: each Learning Indicator is preceded by an **"Enquiry Routes"** block — a set of guiding historical-inquiry questions (e.g. "What events have you witnessed in the past? ... Why are these events significant?", p.27) — inserted before the named pedagogy (Experiential Learning, Collaborative Learning, Problem-Based Learning, Project-Based Learning, Cooperative Learning, Technology-Enhanced Active Learning, etc.).
- **Curriculum code format:** `{Year}.{Strand}.{SubStrand}.{Type}.{SequenceNumber}`, e.g. `1.1.1.LO.1` (Learning Outcome), `1.1.1.LI.1` (Learning Indicator), `1.1.1.AS.1` (Assessment). One Content Standard code was extracted as `1.1.1CS.1` (missing the dot before "CS") on p.29 — this may be a genuine source typo or a pdftotext kerning artifact; it is inconsistent with the dotted format used everywhere else (including all LO/LI/AS codes on the same page). A clearer source-confirmed typo also appears on pp.135-136: inside the Content Standard `3.3.4.CS.1` block, the second Learning Indicator and its Assessment item are labelled `3.3.3.LI.2` and `3.3.3.AS.2` (Sub-Strand "3" instead of the surrounding "4") — an apparent numbering slip in the original document, reproduced here as printed.
- **Category B elements present:**
  - [x] Exemplars — header "Pedagogical Exemplars", combined into "Learning Indicators and Pedagogical Exemplars with 21st Century Skills and Competencies, and GESI"; named strategies include Experiential Learning, Collaborative Learning, Problem-Based Learning, Project-Based Learning, Cooperative Learning, Technology-Enhanced Active Learning
  - [x] Core Competencies — not labelled "Core Competencies" verbatim; functionally covered by the "21st Century Skills and Competencies" column/front-matter section
  - [x] Values — header "GESI, SEL and Shared National Values" (LO table) plus a "National Core Values" bullet list per Learning Outcome (e.g. Tolerance, Honesty, Truthfulness, Respect, Diversity, Loyalty, Cohesion)
  - [x] Pedagogical guidance — front-matter section "Learning and Teaching Approaches" (pp.13-16, identical boilerplate to Physics/Robotics) plus per-Learning-Indicator "Enquiry Routes" and named pedagogies
  - [x] Assessment guidance — "Assessment" column citing "Level 1 Recall / Level 2 Skills of conceptual understanding / Level 3 Strategic reasoning / Level 4 Extended critical thinking and reasoning" (Webb's DoK-aligned); front matter has the same "Curriculum and Assessment Design: Revised Bloom's Taxonomy and Webb's Depth of Knowledge" section as Physics/Robotics
  - [x] Teaching and Learning Resources (TLR) — exact header "Teaching and Learning Resources", listed per Content Standard block
  - [x] Suggested Activities — present as bulleted sub-steps inside the named pedagogies (not a separately labelled column)
  - [x] Cross-Cutting Themes — not a standalone header; referenced generically in front matter, same boilerplate phrase as other subjects
  - [x] GESI — exact acronym "GESI" (Gender Equality and Social Inclusion), defined in front matter (p.11 heading "Gender Equality and Social Inclusion (GESI)") and appears as "GESI:" sub-block per Learning Outcome
  - [x] SEL — exact acronym "SEL", defined with "Social Emotional Learning (SEL): Five Core Competencies with Examples" in front matter (pp.11-12); appears as "SEL:" sub-block per Learning Outcome
  - [x] National Values — "Shared National Values" (front matter) / "National Core Values" (per-LO bullet list)
  - [x] 21st Century Skills — exact header "21st Century Skills and Competencies" in front matter (p.9) and as a per-row table column
- **Extraction feasibility:** COMPLETE — native digital text layer, fully searchable, not scanned. Caveats: (1) the generic front-matter pages describing Webb's DoK/Bloom's Taxonomy (around printed p.16-17 / PDF page 18) contain a severely garbled, character-interleaved paragraph plus a stray "Agricultural Science" label — this is the same corrupted boilerplate block observed verbatim in the other SHS PDFs sampled in this batch (ICT, Manufacturing Engineering), so it is a shared front-matter defect rather than History-specific; (2) some pages show minor OCR-style character duplication in bold headers; (3) at least one Content Standard code is missing a dot (`1.1.1CS.1`) and one Learning Indicator/Assessment pair is mislabelled with the wrong Sub-Strand digit (`3.3.3.LI.2`/`3.3.3.AS.2` inside a `3.3.4` Content Standard block) — both noted above.
- **Notes on anything unusual or differing from other subjects:** (1) Front matter (pp.7-20) is the same generic "THE SHS CURRICULUM OVERVIEW"/"INTRODUCTION" boilerplate seen in Physics/Robotics, including the identical leaked artifact on page 3 reading "PHYSICAL AND HEALTH EDUCATION CURRICULUM FOR BASIC 7 - 10 (COMMON CORE PROGRAMME) SEPTEMBER 2020" (garbled/interleaved with the real History title) — confirming this is a shared cover-page template defect across the whole SHS PDF batch, not unique to any one subject. (2) The "Scope and Sequence" table (p.22) gives totals: 19 Content Standards, 19 Learning Outcomes, 52 Learning Indicators across SHS 1-3 — a notably smaller curriculum than Physics (59/59/188) or Robotics (36/36/63). (3) History has a subject-specific pedagogical device, "Enquiry Routes" (a list of guiding historical questions), inserted ahead of every Learning Indicator's pedagogy — not present in Physics or Robotics. (4) Strand/Sub-Strand coverage is uneven across years (e.g. Year 1 only covers Strands 1-3, Sub-Strand 1 of Strand 1 has no listed rows in the Scope and Sequence table for Year 1 despite being in the Contents list), similar to the partial-coverage pattern noted in Robotics.

## Representative verbatim sample

Source: page(s) 27, 29 (printed page "HISTORY | 25" / "HISTORY | 27"; PDF document index pages 27, 29), Strand 1 / Sub-Strand 1, Year One

```
Subject       History
Strand 1      Historical Inquiry And Writing
Sub-Strand 1  Nature And Scope Of History

Learning Outcomes
1.1.1.LO.1
Use appropriate historical sources from the environment to communicate effectively
the origins, nature and scope of history while demystifying common misconceptions
associated with the study of history.

21st Century Skills and Competencies
Critical Thinking:
 Learners develop Critical Thinking as they recount and analyse past events
 Learners develop Critical Thinking and Problem-Solving skills as they
   investigate misconceptions associated with history and find solutions to it.
 Learners develop Critical Thinking skills as they examine pieces of
   historical evidence.

National Core Values:
 Tolerance
 Honesty
 Truthfulness
 Respect
 Diversity
 Loyalty
 Cohesion
```

```
Content Standards: 1.1.1CS.1
Demonstrate understanding of the origins, meanings, and nature of history as a
discipline.

Learning Indicators and Pedagogical Exemplars with 21st Century Skills and Competencies, and GESI: 1.1.1.LI.1
Trace the origins and meanings of the word 'history' using conventional and non-
conventional sources.

Enquiry Routes: What events have you witnessed in the past? What was the event about? Which
people took part in those events? When did the events happen? Why are these events significant? Where
did these events happen? What were the cause(s)? Did the cause(s) have short-term or long-term
consequences? Were the events a one-time event or continue to impact the society? if the latter, in what
ways?

Experiential Learning:
 In pairs or small mixed-ability groups, learners recount activities they have experienced in the
    past by recollecting old photos, narratives, diaries, songs, documents, or stories told to them by
    their grand/parents, etc.
 Learners conduct a survey on common terminologies used in their community to describe
    history. E.g., 'abaksm', in Akan; 'Taarihi' in Dagbani; 'blema saji' in Ga; 'gbeenyawo' in Ewe;
    'Adrash3' in Gonja; etc.

Assessment: 1.1.1.AS.1
Level 1 Recall
Level 2 Skills of conceptual understanding
Level 3 Strategic reasoning
Level 4 Extended critical thinking and reasoning
```

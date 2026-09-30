# SOCIAL STUDIES CURRICULUM FOR SECONDARY EDUCATION (SHS 1-3)

- **Source file:** curriculum-sources/Social-Studies-Curriculum.pdf
- **Subject:** Social Studies
- **Level/Form/Class coverage:** SHS 1-3 (document organises content into "YEAR ONE", "YEAR TWO", "YEAR THREE")
- **Issuing authority:** National Council for Curriculum and Assessment (NaCCA), Ministry of Education, Republic of Ghana (in association with Ghana Education Service)
- **Publication year/version:** September 2023 (as printed on the cover); the PDF's internal document properties record a creation date of 28 August 2024 and a modification date of 3 October 2024, i.e. the file itself was re-exported roughly a year after the printed cover date.
- **Document format:** PDF
- **Page count:** 113 pages (PDF page index/pypdf page count). The highest printed page-footer number found in the body text is "SOCIAL STUDIES | 111", on the last content page — a roughly 2-page offset between the PDF's own page index and the document's printed footer numbering.
- **Apparent structure (hierarchy levels, in order, exact terminology):**
  1. **Strand** (e.g. "Strand 1. Identity, Significance and Purpose")
  2. **Sub-Strand** (e.g. "Sub-Strand 1. A geographical and historical sketch of Africa")
  3. **Content Standards** (e.g. "1.1.1.CS.1")
  4. **Learning Outcomes** ("Learning Outcomes" — in a separate table above the Content Standards table, e.g. "1.1.1.LO.1")
  5. **Learning Indicators** (e.g. "1.1.1.LI.1") — presented together with **Pedagogical Exemplars** in one combined column, under the header "Learning Indicators and Pedagogical Exemplars with 21st Century Skills and Competencies, and GESI"
  6. **Assessment** entries tied to each Learning Indicator (e.g. "1.1.1.AS.1"), scored against Webb's DoK Levels 1-4
  - Each Sub-Strand also carries a "Teaching and Learning Resources" block at the end (e.g. "Stationery", "Computers/ laptops", "Standard textbooks").
  - Note: the same two-table-per-sub-strand layout as Physics/Robotics/RME — Table A = "Learning Outcomes | 21st Century Skills and Competencies | GESI, SEL and Shared National Values"; Table B = "Content Standards | Learning Indicators and Pedagogical Exemplars with 21st Century Skills and Competencies, and GESI | Assessment". Note the header wording here is slightly longer/more explicit than RME's ("...with 21st Century Skills and Competencies, and GESI" vs RME's "...with 21st Century Skills and GESI").
- **Curriculum code format:** `{Year}.{Strand}.{SubStrand}.{Type}.{SequenceNumber}`, e.g. `1.1.1.LO.1` (Learning Outcome), `1.1.1.CS.1` (Content Standard), `1.1.1.LI.1`/`1.1.1.LI.2`/`1.1.1.LI.3` (Learning Indicators), `1.1.1.AS.1` (Assessment). A later-in-document example from Year 3: `3.6.6.LO.1` (Year 3, Strand 6, Sub-Strand 6). Same scheme as Physics/Robotics/RME.
- **Category B elements present:**
  - [x] Exemplars — header "Learning Indicators and Pedagogical Exemplars with 21st Century Skills and Competencies, and GESI" (Content Standards table column)
  - [x] Core Competencies — not labelled "Core Competencies" verbatim; covered under the column header "21st Century Skills and Competencies", itemised per Learning Outcome (e.g. "Geographical Knowledge and Skills", "Critical Thinking and Problem-Solving Skills", "Communication & Collaboration skills", "Historical Understanding and Inquiry Skills")
  - [x] Values — header "GESI, SEL and Shared National Values" (LO table) plus a "National Values to be embedded in the relevant pedagogy:" bullet list per Learning Outcome (e.g. Tolerance, Honesty, Truthfulness, Respect, Diversity, Loyalty, Social Cohesion)
  - [x] Pedagogical guidance — embedded as named pedagogies inside the Learning Indicators column (e.g. "Interactive map exploration:", "Problem-based learning:", "Talk for learning:", "Experiential learning:") plus the shared front-matter section "Learning and Teaching Approaches"
  - [x] Assessment guidance — "Assessment" column citing "Level 1 Recall / Level 2 Skills of conceptual understanding / Level 3 Strategic reasoning / Level 4 Extended critical thinking and reasoning" (Webb's DoK-aligned); front matter has the shared section "Curriculum and Assessment Design: Revised Bloom's Taxonomy and Webb's Depth of Knowledge"
  - [x] Teaching and Learning Resources (TLR) — exact header "Teaching and Learning Resources", listed per Content Standard block
  - [x] Suggested Activities — present as bulleted/named sub-steps inside the Pedagogical Exemplars text, not a separately labelled column
  - [x] Cross-Cutting Themes — not a standalone header; referenced generically in the shared front matter
  - [x] GESI — exact acronym "GESI" (Gender Equality and Social Inclusion), defined in shared front matter and appears as a labelled sub-block ("GESI:") inside Learning Outcome rows
  - [x] SEL — exact acronym "SEL", defined with "Five Core Competencies" in shared front matter; appears as "SEL:" sub-block per Learning Outcome (e.g. "SEL: Through different learning experiences and exposure, learners: acknowledge injustices and their impact on their learning...")
  - [x] National Values — "Shared National Values" (front matter) / "National Values to be embedded in the relevant pedagogy" (per-LO bullet list)
  - [x] 21st Century Skills — exact header "21st Century Skills and Competencies"; shared front-matter section enumerates the same competency list as Physics/Robotics/RME
- **Extraction feasibility:** COMPLETE — text layer extracts cleanly and is fully searchable (native digital PDF, not scanned). Caveats: (1) table cells wrap awkwardly across page breaks in raw extraction, occasionally interleaving footer/page-number text from adjacent pages (observed e.g. as a merged "108 |  SOCIAL STUDIES 88" fragment where a page footer and an unrelated stray number were concatenated); (2) pypdf reports it cannot fully parse the encoding of several embedded CFF Type1 subset fonts used in this PDF ("WAFASQ+Arial-ItalicMT", "JEQUIF+Poppins-Medium", "IAGOUH+Poppins-Light") even with fontTools installed — this did not visibly corrupt the plain-English body text sampled, but italicised text spans set in these fonts are a plausible risk area for a future extraction pass to double-check; (3) the dense multi-column Scope and Sequence summary table (page 21-22) renders as concatenated digit runs without clear column delimiters in raw text extraction (e.g. "113", "222", "3112"), so its per-Sub-Strand CS/LO/LI breakdown will need careful re-parsing from the PDF's underlying table/column geometry rather than plain text scraping.
- **Notes on anything unusual or differing from other subjects:** (1) The document opens with the same generic "THE SHS CURRICULUM OVERVIEW" / "INTRODUCTION" front matter seen in Physics/Robotics/RME. (2) A leftover copy-paste artifact was found mid-document rather than just on the cover: the page-footer text at the end of the Philosophy/Vision/Goal/Contextual Issues section (contents-listed as page 19) reads "PHYSICAL EDUCATION & HEALTH (CORE) | 19" instead of "SOCIAL STUDIES | 19" — the same leftover Physical and Health Education template residue seen elsewhere in this document batch, but here it survives as an intact deep-in-document footer rather than being confined to the cover page. (3) This is the largest of the three subjects inventoried in this batch: 113 pages, 6 Strands (Identity/Significance and Purpose; Environment and Sustainability; Law and Order in the [Ghanaian] Society; Nationalism and Nationhood; Ethics and Human Development; Production, Exchange and Creativity), each with multiple Sub-Strands distributed unevenly across the 3 years. Scope and Sequence totals: 33 Content Standards, 33 Learning Outcomes, 70 Learning Indicators across SHS 1-3 (CS and LO counts are equal here, unlike Spanish — see spanish.md). (4) Some Sub-Strand table headers in the Contents page are misaligned/interleaved in the raw text extraction (e.g. "SUB-STRAND 1. INDIGENOUS KNOWLEDGE SYSTEMS" and "STRAND 4. CIVIC IDEALS AND PRACTICES" print on adjacent lines out of visual reading order) — a table-of-contents-specific layout artifact rather than a body-content problem.

## Representative verbatim sample

Source: page 23-24 (printed page number "SOCIAL STUDIES | 23"/"24"; Learning Outcomes table, Strand 1 / Sub-Strand 1, Year One)

```
Subject              Social Studies
Strand               1. Identity, Significance and Purpose
Sub-Strand           1. A geographical and historical sketch of Africa

Learning Outcomes         21st Century Skills and Competencies                                                GESI, SEL and Shared National Values
1.1.1.LO.1
Use maps to describe key  Geographical Knowledge and Skills: Learners develop geographical skills             GESI: Learners having experienced a
geographical features of  as they:                                                                            teaching method that ensures gender
Africa and how they                                                                                           equality and social inclusion, where they
shaped Africa's ancient        locate and identify key geographical features of Africa on a map.              work with each other in an inclusive way
societies                      analyse physical maps to understand variations in terrain, climate, and        through cross-sharing knowledge and
                                   vegetation across different regions                                        understanding among groups and individuals
                                                                                                              will be empowered to:
                                                                                                               challenge traditional narratives that
                                                                                                                   exclude the perspectives of marginalised
                                                                                                                   groups
```

(Content Standards / Learning Indicators / Assessment table, same Sub-Strand, printed page "SOCIAL STUDIES | 25")

```
Content Standards       Learning Indicators and Pedagogical Exemplars with 21st Century Skills and                                  Assessment
                        Competencies, and GESI
1.1.1.CS.1              1.1.1.LI.1                                                                                                  1.1.1.AS.1
Demonstrate             Describe the major geographic features and ecosystems of Africa, e.g., rivers, deserts,                     Level 1 Recall
understanding of the    mountains, coastlines, vegetations                                                                          Level 2 Skills of
diverse geographical                                                                                                                conceptual
features and resources  Interactive map exploration:                                                                                understanding
of Africa and their          With the aid of maps of Ghana, learners identify geographical features, e.g., rivers (Pra,             Level 3 Strategic
impact on early human            Ankobra, Volta, etc.), mountains (Akwapim-Togo Range, Gambaga escarpment, etc.),                   reasoning
development                      vegetations (savannah, forest, coastal)                                                            Level 4 Extended
                             With the aid of maps of Africa, learners identify the location of major geographic features            critical thinking and
                                 and ecosystems of Africa, e.g., rivers (Nile, Niger, Congo), deserts (Sahara, Namib,               reasoning
                                 Kalahari), mountains (Kilimanjaro, Guinea and Ethiopian Highlands), coastlines, vegetation
```

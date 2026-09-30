# SPANISH CURRICULUM FOR SECONDARY EDUCATION (SHS 1-3)

- **Source file:** curriculum-sources/Spanish-Curriculum.pdf
- **Subject:** Spanish
- **Level/Form/Class coverage:** SHS 1-3 (document organises content into "YEAR ONE", "YEAR TWO", "YEAR THREE")
- **Issuing authority:** National Council for Curriculum and Assessment (NaCCA), Ministry of Education, Republic of Ghana (in association with Ghana Education Service)
- **Publication year/version:** September 2023 (as printed on the cover); the PDF's internal document properties record a creation date of 2 September 2024 and a modification date of 3 September 2024, i.e. the file itself was re-exported roughly a year after the printed cover date.
- **Document format:** PDF
- **Page count:** 113 pages (PDF page index/pypdf page count). The highest printed page-footer number found in the body text is "SPANISH | 111", on the last content page — a roughly 2-page offset between the PDF's own page index and the document's printed footer numbering.
- **Apparent structure (hierarchy levels, in order, exact terminology):**
  1. **Strand** (e.g. "Strand 1. Saludos y Presentaciones" — Spanish-language strand titles)
  2. **Sub-Strand** (e.g. "Sub-Strand 1. Saludar/Despedirse")
  3. **Content Standards** (e.g. "1.1.1.CS.1")
  4. **Learning Outcomes** ("Learning Outcomes" — in a separate table above the Content Standards table, e.g. "1.1.1.LO.1")
  5. **Learning Indicators** (e.g. "1.1.1.LI.1") — presented together with **Pedagogical Exemplars** in one combined column, under the header "Learning Indicators and Pedagogical Exemplars with 21st Century and GESI"
  6. **Assessment** entries tied to each Learning Indicator (e.g. "1.1.1.AS.1"), scored against Webb's DoK Levels 1-4
  - Each Sub-Strand also carries a "Teaching and Learning Resources" block at the end (e.g. "Audio-visual resources like videos, YouTube and worksheets").
  - Note: the same two-table-per-sub-strand layout as Physics/Robotics/RME/Social Studies — Table A = "Learning Outcomes | 21st Century Skills and Competencies | GESI, SEL and Shared National Values"; Table B = "Content Standards | Learning Indicators and Pedagogical Exemplars with 21st Century and GESI | Assessment". The Table B header here is the abbreviated form (omits "Skills and Competencies"), matching RME's wording rather than Social Studies' longer wording.
  - **Key structural difference from the other subjects inventoried:** the actual Content Standard / Learning Outcome / Learning Indicator text itself is written bilingually — the target-language student-facing content (e.g. greetings, self-description phrases, the CS/LI wording) is written in **Spanish**, while the surrounding scaffolding (21st Century Skills descriptions, GESI/SEL commentary, pedagogy labels, Teaching and Learning Resources) remains in **English**. No other subject inventoried so far (Physics, Robotics, RME, Social Studies) mixes languages this way.
- **Curriculum code format:** `{Year}.{Strand}.{SubStrand}.{Type}.{SequenceNumber}`, e.g. `1.1.1.LO.1` (Learning Outcome), `1.1.1.CS.1` (Content Standard), `1.1.1.LI.1` (Learning Indicator), `1.1.1.AS.1` (Assessment). Same scheme as the other four subjects. Numbering-format typos are present in the source: e.g. `1.1.1LI.2` and `1.1.1AS.2` (missing the dot between the sub-strand number and the type code, page 25) where the surrounding codes are consistently `1.1.1.LI.2` / `1.1.1.AS.2` elsewhere.
- **Category B elements present:**
  - [x] Exemplars — header "Learning Indicators and Pedagogical Exemplars with 21st Century and GESI" (Content Standards table column)
  - [x] Core Competencies — not labelled "Core Competencies" verbatim; covered under the column header "21st Century Skills and Competencies" (e.g. "Communication and collaboration", "Creativity and innovation", "Cultural identity and global citizenship", "Critical thinking", "Digital literacy")
  - [x] Values — header "GESI, SEL and Shared National Values" (LO table) plus a "National Core Values:" bullet list per Learning Outcome (e.g. Tolerance, Friendliness, Open mindedness, Patience, Commitment, Hard work, Integrity)
  - [x] Pedagogical guidance — embedded as named pedagogies inside the Learning Indicators column, several with Spanish labels/content (e.g. "Rompehielos (ice breaker):", "Collaborative learning:", "Learning through observation:", "Building on what others say:", "Tú vs. Usted:") plus the shared front-matter section "Learning and Teaching Approaches"
  - [x] Assessment guidance — "Assessment" column citing "Level 1 Recall / Level 2 Skills of conceptual understanding / Level 3 Strategic reasoning / Level 4 Extended critical thinking and reasoning" (Webb's DoK-aligned); front matter has the shared section "Curriculum and Assessment Design: Revised Bloom's Taxonomy and Webb's Depth of Knowledge"
  - [x] Teaching and Learning Resources (TLR) — exact header "Teaching and Learning Resources", listed per Content Standard block (e.g. "Audio-visual resources like videos, YouTube and worksheets")
  - [x] Suggested Activities — present as bulleted/named sub-steps inside the Pedagogical Exemplars text, not a separately labelled column
  - [x] Cross-Cutting Themes — not a standalone header; referenced generically in the shared front matter
  - [x] GESI — exact acronym "GESI" (footnoted as "Gender Equality and Social Inclusion", e.g. page 24: "1 Gender Equality and Social Inclusion"), defined in shared front matter and appears as a labelled sub-block ("GESI:") inside Learning Outcome rows
  - [x] SEL — exact acronym "SEL" (footnoted as "Socio-Emotional Learning"), defined with "Five Core Competencies" in shared front matter; sub-block content for SEL is folded into the same paragraph as GESI in some rows rather than always appearing as a separate "SEL:" label (see verbatim sample below, where the footnote markers "1"/"2" for GESI/SEL appear but the body text under the LO table is GESI-labelled only)
  - [x] National Values — "Shared National Values" (front matter) / "National Core Values:" (per-LO bullet list)
  - [x] 21st Century Skills — exact header "21st Century Skills and Competencies"; shared front-matter section enumerates the same competency list as the other subjects
- **Extraction feasibility:** PARTIAL. The text layer is native and machine-readable (not scanned), and plain-ASCII English scaffolding text (pedagogy names, GESI/SEL commentary, headers, front matter) extracts cleanly. However, **accented Spanish characters are corrupted on extraction**: every observed accented vowel (á, é, í, ó, ú) and at least "ñ"-bearing word extracted as a "�"/"�" replacement character in both `pdftotext -layout` output and direct `pypdf` page text extraction (tested with fontTools installed to rule out a missing-dependency cause) — e.g. "Despu�s de esta sesi�n" (should read "Después de esta sesión"), "hisp�nico" (should read "hispánico"), "j�venes" (should read "jóvenes"), "clim�ticos" (should read "climáticos"). This points to a broken or missing ToUnicode CMap for the accented-character glyphs in the PDF's embedded/subset fonts, not a limitation of the extraction tool — a plain text-layer scrape will silently lose or corrupt diacritics throughout the Spanish-language Content Standards/Learning Outcomes/Learning Indicators text, which is semantically significant for a language curriculum (e.g. verb conjugation, accent-marked stress). A production extraction pipeline for this file will likely need OCR-based re-extraction, a PDF-repair pass to recover/rebuild the font's ToUnicode mapping, or manual verification/correction of accented text against the printed PDF.
- **Notes on anything unusual or differing from other subjects:** (1) The document opens with the same generic "THE SHS CURRICULUM OVERVIEW" / "INTRODUCTION" front matter seen in the other four subjects. (2) Unlike Physics/Robotics/RME/Social Studies, Content Standard and Learning Outcome counts are **not equal**: the Scope and Sequence summary (page 21-22, "Spanish Summary") gives overall totals of 31 Content Standards, 44 Learning Outcomes, and 47 Learning Indicators across SHS 1-3 — i.e. some Sub-Strands carry multiple Learning Outcomes (and in places multiple Content Standards) per Sub-Strand rather than a strict 1-CS-to-1-LO pairing (observed directly in the sample: Sub-Strand 1.1.2 "Presentarse" has both `1.1.2.LO.1` and `1.1.2.LO.2`, and both `1.1.2.CS.1` and `1.1.2.CS.2`). (3) Strand and Sub-Strand titles themselves are printed in Spanish throughout (e.g. "Strand 4. Expresar Gustos y Preferencias", "Sub-Strand 6. Deportes populares en mi comunidad y en el mundo hispánico"), unlike every other subject inventoried, where Strand/Sub-Strand titles are in English. (4) The cover page carries the same leftover Physical and Health Education template artifact seen in the other subjects' front matter (page 1: "PHYSICAL AND HEALRTEPUHBLICEODF GUHACNAATION CURRICULUM ... FOR BASIC 7 - 10").

## Representative verbatim sample

Source: page 23-24 (printed page number "SPANISH | 23"/"24"; Learning Outcomes table, Strand 1 / Sub-Strand 1, Year One) — reproduced exactly as extracted, including the "�" replacement characters where accented Spanish vowels failed to extract cleanly (see Extraction feasibility above):

```
Subject     SPANISH
Strand      1. Saludos y Presentaciones
Sub-Strand  1. Saludar/Despedirse

        Learning Outcomes                         21st Century Skills and Competencies             GESI1, SEL2 and Shared National Values
1.1.1.LO.1
Despu�s de esta sesi�n, el aprendiz  Communication and collaboration: Learners collaborate         GESI: Working with each other in an inclusive
ser� capaz de saludar y depedirse    and exchange greetings using appropriate gestures.            way, cross sharing of knowledge and
de compa�eros/desconocidos.                                                                        understanding between and among groups and
                                     Creativity and innovation: Can be seen in role-playing where  individuals for instance leads to;
                                     learners exchange greetings.                                   Respecting individuals of varying beliefs,

                                                                                                   National Core Values:
                                                                                                    Tolerance,
                                                                                                    Friendliness
                                                                                                    Open mindedness
                                                                                                    Patience
                                                                                                    Commitment
                                                                                                    Hard work
```

(Content Standards / Learning Indicators / Assessment table, same Sub-Strand, printed page "SPANISH | 25")

```
   Content Standards            Learning Indicators and Pedagogical Exemplars with 21st Century and GESI                       Assessment
1.1.1.CS.1                 1.1.1.LI.1                                                                                   1.1.1.AS.1
Saludar y responder a los  Escucha y observa a amigos que se saludan                                                    Level 1 Recall
saludos                                                                                                                 Level 2 Skills of
                           Rompehielos (ice breaker): Procura un audio de personas que se saludan por la ma�ana, la     conceptual
                           tarde y la noche. Los aprendices lo escuchan y repiten los saludos.                          understanding
                                                                                                                        Level 3 Strategic
                           Collaborative learning: En grupos de 2 o 3, los aprendices se saludan usando el vocabulario  reasoning
                           que han aprendido.                                                                           Level 4 Extended critical
                                                                                                                        thinking and reasoning
                           1.1.1LI.2
                           Saluda y desp�dete de los amigos/ las amigas/los compa�eros/las compa�eras.                  1.1.1AS.2
                           (Expresi�n oral -informal/t�)
```

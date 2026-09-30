# FRENCH CURRICULUM FOR SECONDARY EDUCATION (SHS 1-3)

- **Source file:** curriculum-sources/French-Curriculum.pdf
- **Subject:** French
- **Level/Form/Class coverage:** SHS 1-3 ("YEAR ONE", "YEAR TWO", "YEAR THREE")
- **Issuing authority:** National Council for Curriculum and Assessment (NaCCA), Ministry of Education, Republic of Ghana (front matter identical boilerplate to every other subject; not independently re-read for this file but consistent page numbering/footer confirms it)
- **Publication year/version:** Not independently re-confirmed on the cover page for this file (front-matter cover page wasn't in the sampled range), but the shared front-matter template and "SEPTEMBER 2023"-dated sibling documents make it highly likely to match; should be confirmed directly against the cover page during full extraction rather than assumed.
- **Document format:** PDF
- **Page count:** 214 (raw PDF page/form-feed count)
- **Apparent structure (hierarchy levels, in order, exact terminology):** Strand → Sub-Strand → Content Standard → Learning Outcome → Learning Indicator, same shape as other subjects, but organised by **topic/theme, in French**, with sub-strand sets that vary by year (same pattern as Arabic, not a fixed skill-strand set like English Language):
  1. **Strand 1. Faire Connaissance** ("Getting acquainted") — e.g. Sub-Strand "Se présenter et présenter quelqu'un" ("Introducing yourself and someone else")
  2. **Strand 2. Découvrir l'environnement et la vie sociale** ("Discovering the environment and social life")
  3. **Strand 3. Situer les événements dans le temps** ("Situating events in time")
  4. **Strand 4. Les moyens de communication et de déplacement** ("Means of communication and transport")
  - Confirmed from the Scope and Sequence table: several Sub-Strands are entirely absent in some years (marked "- --" i.e. zero CS/LO/LI), e.g. "Parler de la santé et d'environnement" has no Year 1 content but appears in Years 2 and 3 — same "sub-strands vary by year" pattern documented in Arabic's inventory.
  - **Important:** the top-level scaffolding labels (Subject, Strand, Sub-Strand, Learning Outcomes, 21st Century Skills and Competencies, GESI/SEL and Shared National Values, Content Standards, Assessment) remain in **English** even though all of the actual curriculum content — Strand/Sub-Strand names, Learning Outcome text, GESI/SEL guidance text — is written in **French**. Extraction must preserve the French text verbatim (including accents) and must not translate it.
- **Curriculum code format:** `{Year}.{Strand}.{SubStrand}.{Type}.{Seq}`, e.g. `1.1.1.LO.1` — identical scheme to every other subject.
- **Category B elements present:**
  - [x] Core Competencies — folded into "21st Century Skills and Competencies" header (English), content in French (e.g. "Communication et coopération:", "Littératie numérique:")
  - [x] Values — "GESI¹, SEL² and Shared National Values" header (English), footnoted exactly like other subjects; body text in French (e.g. "GESI: Égalité des sexes et inclusion sociale:", "SEL: Les apprenants ayant fait l'expérience d'une approche pédagogique...")
  - [x] GESI / [x] SEL / [x] 21st Century Skills — all present, same framework, French-language content
  - [ ] Exemplars / Pedagogical guidance / Assessment guidance / Teaching and Learning Resources / Suggested Activities — not independently confirmed in the sampled pages (Scope and Sequence + first Learning Outcome block only); expected present by pattern.
- **Extraction feasibility:** COMPLETE, **but encoding-sensitive** — plain-text extraction without an explicit UTF-8 flag renders French accented characters (é, è, à, ç, etc.) as garbled replacement glyphs (e.g. "�" in place of "é"). This was confirmed directly: the default extraction path corrupted accents, while re-extracting the same pages with UTF-8 encoding forced produced clean, correct French text. **This is an important, subject-specific extraction requirement to carry into full extraction and the canonical import pipeline** — French (and likely Arabic and Spanish) curriculum text must be extracted/stored with correct Unicode handling throughout, not just ASCII-safe text as the science subjects allowed.
- **Notes on anything unusual or differing from other subjects:**
  - Scope and Sequence gives overall SHS 1-3 totals: **49 Content Standards, 49 Learning Outcomes, 189 Learning Indicators** — the second-highest Learning Indicator count of any subject sampled so far (after Arabic's 193).
  - This is a strong structural and linguistic parallel to Arabic (topic-based strands varying by year, non-English content body, English scaffolding labels) — the two subjects likely share the same authoring template internally at NaCCA, distinct from the fixed 5-skill-strand pattern used by English Language.

## Representative verbatim sample

Source: page 22-24 (printed footer "FRENCH | 22"-"24")

```
SCOPE AND SEQUENCE — French Summary
Content Standards 49 / Learning Outcomes 49 / Learning Indicators 189 (Overall Totals, SHS 1-3)

Subject      FRENCH
Strand       1. Faire Connaissance
Sub-Strand   1. Se présenter et présenter quelqu'un

Learning Outcomes                       21st Century Skills and Competencies                                  GESI1, SEL2 and Shared National Values
1.1.1.LO.1
S'engager dans un acte de se            Communication et coopération: Les apprenants apprennent à             GESI: Égalité des sexes et inclusion
présenter et présenter quelqu'un.       écouter afin de bien comprendre leurs interlocuteurs et de réagir de  sociale:
                                        manière appropriée pour une bonne collaboration.                      Les apprenants se respectent et
                                                                                                              s'entendent. Ils sont tolérants les uns
                                        Littératie numérique: Les apprenants apprennent à utiliser les        envers les autres. Ils comprennent leurs
                                        Smartphones et les enceintes Bluetooth dans l'apprentissage.          capacités par rapport aux autres.

SEL: Les apprenants ayant fait l'expérience d'une approche pédagogique garantissant
l'égalité des sexes et l'inclusion sociale, où ils travaillent les uns avec les autres de
manière inclusive; partagent leurs connaissances et leur compréhension dans les
groupes et avec les individus. En ce faisant, ils apprennent donc à:
• respecter les individus d'origines différentes.
• embrasser la diversité et pratiquer l'inclusion.
• examiner et dissiper les idées fausses et les mythes sur le genre
```

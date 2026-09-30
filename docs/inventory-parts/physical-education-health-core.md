# PHYSICAL EDUCATION & HEALTH (CORE) CURRICULUM FOR SECONDARY EDUCATION (SHS 1-3)

- **Source file:** curriculum-sources/PHYSICAL-EDUCATION-HEALTH-CORE-Curriculum.pdf
- **Subject:** Physical Education & Health (Core)
- **Level/Form/Class coverage:** SHS 1-3 ("YEAR 1", "YEAR 2", "YEAR 3" — note this document uses numerals "YEAR 1/2/3" rather than the spelled-out "YEAR ONE/TWO/THREE" seen in every other subject sampled so far, a minor but real formatting difference)
- **Issuing authority:** National Council for Curriculum and Assessment (NaCCA), Ministry of Education, Republic of Ghana; Ghana Education Service also credited
- **Publication year/version:** September 2023 (visible on the cover page, though badly garbled by the same character-interleaving corruption described below)
- **Document format:** PDF
- **Page count:** 88 (raw PDF page/form-feed count)
- **Apparent structure (hierarchy levels, in order, exact terminology):** This is the **first subject sampled with only a single Strand**: "Strand 1. Physical Activity and Health" covers the entire subject across all three years. Sub-Strands underneath it vary considerably by year (same "varies by year" pattern as Arabic/French, but here applied within one strand rather than across several):
  - Year 1 Sub-Strands: Career Pathways in Physical Activity and Sports, Traditional Dances, Gymnastics, Organized Sports Participation, Health and Wellness
  - Year 2 Sub-Strands: Sports Participation, Health and Wellness, Traditional Games, Long Distance Events
  - Year 3 Sub-Strands: Sports Participation, Health and Wellness, Traditional Games, Recreational Activities
  - Content Standard → Learning Outcome → Learning Indicator → Assessment levels beneath Sub-Strand follow the same shape as every other subject.
- **Curriculum code format:** `{Year}.{Strand}.{SubStrand}.{Type}.{Seq}`, e.g. `1.1.1.LO.1` — identical scheme to every other subject (confirmed the Strand number is always `1` here, since there is only one Strand).
- **Category B elements present:**
  - [x] Core Competencies — folded into "21st Century Skills and Competencies" (e.g. "Digital literacy", "Collaboration", "Communication", "Learning for life")
  - [x] Values — "GESI, SEL and Shared National Values" header (no footnote superscripts on GESI/SEL in this sample, matching Applied Technology's convention rather than Chemistry's)
  - [x] GESI / [x] SEL / [x] 21st Century Skills — all present; GESI text here is explicitly framed around gender-neutral participation in sport ("Be gender-neutral in choosing career pathways", "Be gender responsive and have the ability to tackle injustice")
  - [ ] Exemplars / Pedagogical guidance / Assessment guidance / Teaching and Learning Resources / Suggested Activities / National Values wording — not independently confirmed in the sampled pages; expected present by pattern.
- **Extraction feasibility:** COMPLETE for the sampled pages (native PDF text layer readable), **but this document's cover page and self-referential footer text are unusually badly corrupted** — worse than the "leftover title fragment" issue seen in the science subjects. Confirmed directly: the cover page itself renders as "SEPHYTSICAEL EMDUCABTIONE&RHEALT2H(C0ORE2)|31" — a garbled, letter-interleaved mix of this document's OWN title with itself (not a different subject's title, unlike the leak pattern seen in Physics/Chemistry/etc., where a *different* subject's title bled in). This confirms the cross-document "PHYSICAL AND HEALTH EDUCATION CURRICULUM FOR BASIC 7-10 (COMMON CORE PROGRAMME)" fragment seen bleeding into every OTHER subject's cover page is a leftover reference to a **real, separate Basic-level (JHS, Basic 7-10) Physical & Health Education curriculum** that is not among the 33 supplied source documents — i.e. that fragment is not random garbage, it names an actual different NaCCA document from a different level, confirming the whole SHS document batch shares one corrupted cover-page authoring template that still contains a stale reference to an unrelated Basic-level document.
- **Notes on anything unusual or differing from other subjects:**
  - Single-strand structure (above) is the most significant finding — this is the first subject where the entire three-year curriculum sits under one Strand, varying only by Sub-Strand composition per year. The canonical extraction schema already supports a Strand having just one child, so no schema change is needed, but this confirms Strand cardinality per subject is genuinely variable and must not be assumed to be "several strands" during full extraction.
  - Scope and Sequence (page 21) gives overall totals: **17 Content Standards, 25 Learning Outcomes, 71 Learning Indicators**.
  - Front matter "Contextual Issues" (page 19) is candid about Ghanaian classroom bias against PE as a subject: "Physical Education curriculum in Senior High Schools has been undervalued and under resourced due to biases and misconceptions... There is gender stereotype, overuse of teacher-centered approach" — consistent with the pattern of frank subject-specific barriers seen across most humanities/arts/technical subjects sampled.

## Representative verbatim sample

Source: page 21-23 (printed footer "PHYSICAL EDUCATION & HEALTH (CORE) | 21"-"23")

```
SCOPE AND SEQUENCE — Core Physical Education and Health Summary
Content Standards 17 / Learning Outcomes 25 / Learning Indicators 71 (Overall Totals, SHS 1-3)

Subject       Physical Education and Health
Strand 1      Physical Activity and Health
Sub-Strand 1  Career Pathways in Physical Activity and Sports

Learning Outcomes                  21st Century Skills and Competencies               GESI, SEL and Shared National Values
1.1.1.LO.1
Explain various career     Digital literacy: Equipping learners with ICT tools for learning.  GESI: Learners having experienced a
pathways in the physical                                                                      teaching method that ensures gender
education and health       Collaboration: The ability to learn from others to understand and  equality and social
enterprise.                respect their needs.                                               inclusion and working with each other in an
                                                                                              inclusive way, cross-sharing knowledge and
                           Communication: Learners should communicate confidently,            understanding among groups and individuals
                           ethically, and effectively in different social contexts            lead them to:
                                                                                                Be gender-neutral in choosing career
                           Learning for life: Identify interesting career pathways in PE and
                           strive toward becoming a professional in them.                         pathways.
```

# APPLIED TECHNOLOGY CURRICULUM FOR SECONDARY EDUCATION (SHS 1-3)

- **Source file:** curriculum-sources/Applied-Technology-Curriculum.pdf
- **Subject:** Applied Technology
- **Level/Form/Class coverage:** SHS 1-3 ("YEAR ONE", "YEAR TWO", "YEAR THREE")
- **Issuing authority:** National Council for Curriculum and Assessment (NaCCA), Ministry of Education, Republic of Ghana; Ghana Education Service also credited
- **Publication year/version:** September 2023
- **Document format:** PDF
- **Page count:** 199 (raw PDF page/form-feed count)
- **Apparent structure (hierarchy levels, in order, exact terminology):** Strand → Sub-Strand → Content Standard → Learning Outcome → Learning Indicator, same as other SHS subjects, **but with a major structural difference not seen elsewhere so far: a branching "options" pathway.**
  - **Year One is common to all learners**: 5 Strands (Automotive Technology, Building Construction Technology, Electrical and Electronic Technology, Metal Technology, Woodwork Technology), 11 Content Standards total.
  - **Year Two and Three split into three mutually exclusive specialisation options**, each with its own separate Scope-and-Sequence table and its own Strand/Sub-Strand subset:
    - **Option One — Automobile and Metal Technology** (Strands: Automotive Technology, Metal Technology; 8 CS / 8 LO / 48 LI for SHS 2-3)
    - **Option Two — Building Construction and Wood Technology** (Strands: Building Construction Technology, Woodwork Technology; 10 CS / 9 LO / 49 LI for SHS 1-3 as printed, though this total appears to include Year 1 figures — the table heading says "SHS 1 - 3" unlike Option One's "SHS 2 - 3", an inconsistency in the source itself worth flagging)
    - **Option Three — Electrical and Electronic Technology** (Strand: Electrical and Electronic Technology only; 4 CS / 4 LO / 48 LI)
  - **This means the canonical extraction schema's `classLevels`/pathway model must support an optional "option/pathway" dimension for this subject** — a Learning Indicator in Year 2 or 3 belongs not just to a Year and Strand but to one of three named options, which the current Prisma schema (`ClassLevel` is just a flat SHS1/2/3 sequence) has no field for. This is the first subject encountered that needs this; none of Physics/Robotics/Chemistry/Computing/Agriculture/Agricultural Science branch this way.
- **Curriculum code format:** `{Year}.{Strand}.{SubStrand}.{Type}.{Seq}`, e.g. `1.1.1.LO.1` in the Scope and Sequence table, but the in-body Learning Outcome code is printed with a formatting slip as **`1.1.1L.O.1`** (period misplaced inside "LO") in the one sample read — an apparent source typo, to be preserved verbatim (not silently corrected) if this exact record is ever extracted, but also re-checked against other occurrences since it may just be this one instance.
- **Category B elements present:**
  - [x] Core Competencies — folded into "21st Century Skills and Competencies" (e.g. "Communication and collaboration skills", "Critical thinking and Problem-solving skills")
  - [x] Values — "GESI, SEL and Shared National Values" header (no footnote-number superscripts on GESI/SEL in this sample, unlike Chemistry/Computing/Agricultural Science/Agriculture — another minor formatting variance)
  - [x] GESI / [x] SEL / [x] 21st Century Skills — all present, consistent framework
  - [ ] Exemplars / Pedagogical guidance / Assessment guidance / Teaching and Learning Resources / Suggested Activities / National Values wording — **not independently confirmed** in the small sample read (front matter + Scope and Sequence + first Learning Outcome block only); expected present by pattern but not directly verified.
- **Extraction feasibility:** COMPLETE for the sampled pages (native PDF text layer). Given the branching-options structure and this document's size (199 pages, largest technical/vocational subject sampled after Agriculture), a substantially wider read will be needed during full extraction to correctly map every Content Standard to its correct option.
- **Notes on anything unusual or differing from other subjects:**
  - The branching-options structure (above) is the standout finding — this is a genuine, source-confirmed structural difference, not an extraction artefact. It closely resembles how real Ghanaian SHTS technical programmes work (students specialise after a common foundation year), so the data model must represent it faithfully rather than forcing it into the flat Strand/Sub-Strand shape used elsewhere.
  - Same shared front-matter template (SHS Curriculum Overview, 21st Century Skills, GESI/SEL framework, Webb's DoK) as every other subject sampled.

## Representative verbatim sample

Source: page 25-26 (printed footer "APPLIED TECHNOLOGY | 25" / "26")

```
Subject                  APPLIED TECHNOLOGY
Strand 1.                AUTOMOTIVE TECHNOLOGY
Sub-Strand 1.            INTRODUCTION TO ENGINE TECHNOLOGY

Learning Outcomes                   21st Century Skills and Competencies                            GESI, SEL and Shared National Values
1.1.1L.O.1
Analyse and use relevant            Communication and collaboration skills:                         GESI: Learners having experienced a teaching
principles underlying engines to     As learners work in groups they listen to peers and ask       approach that ensures gender equality and social
service, and repair spark ignition                                                                  inclusion, where they work with each other in an
(SI) and compression ignition (CI)      relevant questions based on what they heard.                inclusive way; cross-sharing knowledge and
engines                              Learning from and contributing to the learning of others.     understanding among groups and individuals lead
                                                                                                    them to:
                                                                                                     Examine and dispel misconceptions/ myths
                                                                                                         about gender as they relate to technical
                                                                                                         education

SEL: All learning experiences related to engine technology should give learners the
opportunities to develop the social emotional learning competencies, which include self-
awareness, self-management, social awareness, relationship skills, and responsible decision-
making.
```

Scope and Sequence option headings (page 22-24, printed footer "APPLIED TECHNOLOGY | 22"-"24"):

```
SCOPE AND SEQUENCE — Applied Technology Summary (Year 1, common to all learners)
Content Standards 11 / Learning Outcomes 11 / Learning Indicators 32

Year Two and Three Scope and Sequence
Applied Technology Summary - Automobile and Metal Technology (Option One)
  Content Standards 8 / Learning Outcomes 8 / Learning Indicators 48 (SHS 2-3)
Applied Technology Summary - Building Construction and Wood Technology (Option Two)
  Content Standards 10 / Learning Outcomes 9 / Learning Indicators 49 (SHS 1-3, as printed)
Applied Technology Summary - Electrical and Electronic Technology (Option Three)
  Content Standards 4 / Learning Outcomes 4 / Learning Indicators 48
```

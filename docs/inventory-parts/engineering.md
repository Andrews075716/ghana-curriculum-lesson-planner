# ENGINEERING CURRICULUM FOR SECONDARY EDUCATION (SHS 1 - 3)

- **Source file:** curriculum-sources/Engineering-Curriculum.pdf
- **Subject:** Engineering
- **Level/Form/Class coverage:** SHS 1-3 ("YEAR ONE", "YEAR TWO", "YEAR THREE")
- **Issuing authority:** National Council for Curriculum and Assessment (NaCCA), Ministry of Education, Republic of Ghana (Ghana Education Service also credited)
- **Publication year/version:** September 2023 (cover title block shows the same garbled overlapping-text artifact seen in DCT/Economics; copyright line "©2023 National Council for Curriculum and Assessment (NaCCA)" confirms 2023)
- **Document format:** PDF
- **Page count:** 144 pages by extraction-tool page count (form-feed count via `pdftotext`); last content page's printed footer reads "ENGINEERING | 143" — 1-page offset consistent with an unnumbered cover page preceding the numbered footer sequence (same pattern as the other subjects reviewed)
- **Apparent structure (hierarchy levels, in order, exact terminology):**
  1. **Strand** (e.g. "STRAND 1. ENGINEERING PRACTICE" / in-table "Strand 1. ENGINEERING PRACTICE")
  2. **Sub-Strand** (e.g. "SUB-STRAND 1. ENGINEERING IN SOCIETY" / in-table "Sub-Strand 1. ENGINEERING IN SOCIETY")
  3. **Learning Outcomes** (e.g. "1.1.1.LO.1") — table with "21st Century Skills and Competencies" and "GESI, SEL and Shared National Values" columns
  4. **Content Standards** (e.g. "1.1.1.CS.1") — separate table
  5. **Learning Indicators** (e.g. "1.1.1.LI.1") — same cell as, combined with, "Pedagogical Exemplars with 21st Century Skills and Competencies, and GESI"
  6. **Assessment** entries per Learning Indicator (e.g. "1.1.1.AS.1"), same four-level Webb's DoK scale ("Level 1 Recall / Level 2 Skills of conceptual understanding / Level 3 Strategic reasoning / Level 4 Extended critical thinking and reasoning")
  - Each Sub-Strand block ends with a **"Teaching and Learning Resources"** list (matches Physics/Robotics terminology, NOT the "Teaching and Learning Materials" label seen in DCT and Economics).
  - Same two-table-per-Sub-Strand pattern as the other subjects.
- **Curriculum code format:** `{Year}.{Strand}.{SubStrand}.{Type}.{SequenceNumber}`, e.g. `1.1.1.LO.1` (Learning Outcome), `1.1.1.CS.1` (Content Standard), `1.1.1.LI.1` (Learning Indicator), `1.1.1.AS.1` (Assessment). Same scheme as the other subjects reviewed. A late-document example: `3.4.2.CS.1` / `3.4.2.LI.1` / `3.4.2.AS.1` (Year 3, Strand 4, Sub-Strand 2).
- **Category B elements present:**
  - [x] Exemplars — header "Pedagogical Exemplars" (combined column header "Learning Indicators and Pedagogical Exemplars with 21st Century Skills and Competencies, and GESI")
  - [x] Core Competencies — not a standalone verbatim header; functionally covered under "21st Century Skills and Competencies" per-row entries (e.g. "Communication:", "Collaboration:", "Critical Thinking:", "Social Skills:")
  - [x] Values — header "GESI, SEL and Shared National Values" (table column) plus inline "National Core Values:" bullet list per Learning Outcome (e.g. "Tolerance, Integrity, Accountability, Humility, Assertiveness, Patriotism")
  - [x] Pedagogical guidance — named pedagogies embedded in the Learning Indicators column (e.g. "Managing Talk for Learning:", "Initiating Talk for Learning:", "Experiential Learning:", "Collaborative Learning:", "Building on What Others say:", "Self-Directed Learning:", "Project-based experiential Learning:")
  - [x] Assessment guidance — "Assessment" column with the same four-level DoK scale per Learning Indicator
  - [x] Teaching and Learning Resources (TLR) — exact header "Teaching and Learning Resources", used consistently per Sub-Strand block (e.g. "Projector, Laptop and videos on engineering works"; "Arduino Embedded System Kits, Audio-visual equipment, Video documentaries, Laptops with MS Office installed")
  - [x] Suggested Activities — bulleted/named sub-steps embedded inside Pedagogical Exemplars text, not a separate column
  - [x] Cross-Cutting Themes — not a standalone header; referenced generically in front matter only, same as other subjects
  - [x] GESI — front-matter heading "Gender Equality and Social Inclusion (GESI)"; footnote markers "1Gender Equality and Social Inclusion" on early tables; inline "GESI:" sub-block per Learning Outcome row
  - [x] SEL — front-matter section on Social/Socio-Emotional Learning; inline "SEL:" sub-block per Learning Outcome row (not fully sampled in this pass but the "GESI, SEL and Shared National Values" column header confirms presence)
  - [x] National Values — "Shared National Values" (column header) / "National Core Values:" (inline per-LO bullet list)
  - [x] 21st Century Skills — exact header "21st Century Skills and Competencies" (table column header; front matter not independently re-verified in this pass but assumed present given identical boilerplate structure)
- **Extraction feasibility:** PARTIAL — text extracts cleanly overall (native digital PDF, not scanned) but with two notable extraction quirks: (1) a recurring stray single word **"Engineering"** appears inline at the top of many content blocks (e.g. before "Subject ENGINEERING", after page-footer lines, and interleaved mid-table) — this is almost certainly a vertical/rotated sidebar tab label (a design element placed in the page margin) that `pdftotext -layout` is folding into the linear text stream; it is not curriculum content and must be filtered out during automated extraction. (2) A short run of unreadable glyph characters (`'^Z/Z` / `^ZZZZ>`) appears around printed page "ENGINEERING | 23", the same icon/image artifact seen in the Economics PDF. (3) The "SCOPE AND SEQUENCE" summary table (page 20/21) extracts with numeric columns badly run together (e.g. "5112124", "41 13 18 34 12 18 30") due to dense multi-column layout — automated parsing of this specific table will need manual verification. Body content tables (LO/CS/LI/Assessment) themselves extract with good fidelity.
- **Notes on anything unusual or differing from other subjects:** (1) Front matter (pages 3-19ish) is the same generic "SHS Curriculum Overview" boilerplate seen in the other subjects, including the same leftover "PHYSICAL AND HEALTH EDUCATION CURRICULUM...(COMMON CORE PROGRAMME)" template artifact on the cover page (here further garbled into "COMMEONNGCIONREEEPRRIONGGRAMME"). (2) Unlike DCT and Economics, Engineering uses "Teaching and Learning Resources" (matching Physics/Robotics), not "Teaching and Learning Materials" — so the two labels are not simply split along "SHS Technical/Vocational vs. Science" lines; it appears to vary PDF-by-PDF rather than by subject category. (3) The Scope and Sequence "Overall Totals (SHS 1-3)" reads: Content Standards 36, Learning Outcomes 57, Learning Indicators 105 — the Content Standards (36) and Learning Outcomes (57) counts diverge substantially (57 vs 36, a ~1.6x ratio), a larger CS:LO mismatch than seen in Economics (37 vs 38) or Physics/Robotics (which had CS = LO exactly); this strongly suggests Engineering's curriculum frame allows multiple Learning Outcomes per Content Standard rather than a 1:1 mapping, worth flagging for any data model that assumes LO:CS parity. (4) The stray "Engineering" sidebar-label artifact (see Extraction feasibility) is unique to this PDF among the ones sampled so far and was not observed in Physics, Robotics, DCT, or Economics.
- **Representative verbatim sample:** — see below; sourced from page 23-25 (printed page numbers "ENGINEERING | 23" and "ENGINEERING | 25"), Year One, Strand 1 / Sub-Strand 1.

## Representative verbatim sample

Source: page(s) 23 (printed page number "ENGINEERING | 23"), Year One, Strand 1 / Sub-Strand 1

```
Subject      ENGINEERING
Strand       1. ENGINEERING PRACTICE
Sub-Strand   1. ENGINEERING IN SOCIETY

Learning Outcomes
1.1.1.LO.1
Identify engineering footprints in learners' communities.

21st Century Skills and Competencies
Communication: Learners hone their communication skills as they contribute to discussions.
Collaboration: Learners develop the skill of collaboration as they work in groups.
Critical Thinking: Learners develop this skill as they brainstorm engineering disciplines.
Communication Skills: Learners develop this skill as the communicate their ideas to group
members and present the works of groups to the entire class.
Social Skills: Learners acquire social skills as they interact in groups.

GESI1, SEL2 and Shared National Values
GESI: As all learners are supported in an inclusive environment and given equal opportunities
to succeed in an engineering class, they will:
   o appreciate, value, and embrace diversity as they are made to work in groups.
   o learn to amicably resolve conflicts and embrace differing opinions.
   o develop emotional intelligence as their submissions are critiqued by others.

National Core Values:
   o Tolerance
   o Integrity
   o Accountability
   o Humility
   o Assertiveness
   o Patriotism
```

(Content Standards / Learning Indicators / Assessment table, same Sub-Strand, printed page "ENGINEERING | 24")

```
Content Standards: 1.1.1.CS.1
Demonstrate an understanding of the place of engineering in societal development.

Learning Indicators and Pedagogical Exemplars with 21st Century Skills and Competencies, and GESI: 1.1.1.LI.1
Classify the various engineering occupational disciplines.

Managing Talk for Learning: In a moderated discussion, learners share their understanding of
(a) who an engineer is and (b) what engineering entails. Learners should further describe the
work of any engineers they know and explain how important they perceive their work.
Furthermore, learners should describe any engineering works they have seen in their
communities, on television or through other media.

Initiating Talk for Learning: The Facilitator introduces the various disciplines in engineering,
starting with those that were previously mentioned by learners. For each discipline introduced,
individual learners should discuss their role in national development. Use webbing or mind maps
to organise learners' thoughts.

Assessment: 1.1.1.AS.1
Level 1 Recall
Level 2 Skills of conceptual understanding
Level 3 Strategic reasoning
Level 4 Extended critical thinking and reasoning
```

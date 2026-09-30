# CHEMISTRY CURRICULUM FOR SECONDARY EDUCATION (SHS 1-3)

- **Source file:** curriculum-sources/Chemistry-Curriculum.pdf
- **Subject:** Chemistry
- **Level/Form/Class coverage:** SHS 1-3 ("YEAR ONE", "YEAR TWO", "YEAR THREE")
- **Issuing authority:** National Council for Curriculum and Assessment (NaCCA), Ministry of Education, Republic of Ghana; Ghana Education Service also credited
- **Publication year/version:** September 2023
- **Document format:** PDF
- **Page count:** 116 (raw PDF page/form-feed count); printed page-footer numbering runs to at least "CHEMISTRY | 114" near the end of the sampled content — consistent with the same front-matter offset seen in Physics/Robotics/Chemistry-sibling documents
- **Apparent structure (hierarchy levels, in order, exact terminology):** Identical pattern to Physics/Robotics —
  1. **Strand** ("STRAND 1. PHYSICAL CHEMISTRY" in the table of contents; "Strand 1. PHYSICAL CHEMISTRY" in-body)
  2. **Sub-Strand** ("SUB-STRAND 1. MATTER AND ITS PROPERTIES")
  3. **Content Standards** (e.g. "1.1.1.CS.1"), in a table paired with Learning Indicators and Assessment
  4. **Learning Outcomes** (e.g. "1.1.1.LO.1"), in a separate table paired with "21st Century Skills and Competencies" and "GESI, SEL and Shared National Values"
  5. **Learning Indicators** (e.g. "1.1.1.LI.1"), co-located with Pedagogical Exemplars in the Content Standard table
  6. **Assessment** (e.g. "1.1.1.AS.1"), one per Learning Indicator, Webb's DoK Levels 1-4, in the third column of the CS/LI table
  - "Teaching and Learning Resources" block confirmed at the end of at least one Sub-Strand's content (page 113-114), same exact header as Physics/Robotics.
- **Curriculum code format:** `{Year}.{Strand}.{SubStrand}.{Type}.{Seq}`, e.g. `1.1.1.LO.1`, `1.1.1.CS.1`, `1.1.1.LI.1`, `1.1.1.AS.1`, and later in the document `3.2.2.LI.2` / `3.2.2.AS.2` (Year 3, Strand 2, Sub-Strand 2) — same scheme as Physics/Robotics.
- **Category B elements present:**
  - [x] Exemplars — "Learning Indicators and Pedagogical Exemplars with 21st Century and GESI" (same header phrasing as Physics)
  - [x] Core Competencies — folded into "21st Century Skills and Competencies" (not a standalone header), e.g. "Digital Learning", "Collaboration and Communication", "Critical Thinking", "Problem-Solving Skill", "Creativity and Innovation", "Leadership and Personal Development", "Global Citizenship"
  - [x] Values — "GESI, SEL and Shared National Values" column header; footnoted as "GESI¹" / "SEL²" with footnote definitions "Gender Equality and Social Inclusion" / "Socio-Emotional Learning"; "National Core Values:" bullet list embedded per Learning Outcome (e.g. Patriotism, Tolerance, Respect for others, Discipline, Honesty)
  - [x] Pedagogical guidance — named pedagogies embedded in the LI column (e.g. "Talk for Learning:", "Collaborative Learning:", "Exploratory Learning:", "Inquiry-Based Learning:", "Activity-Based Learning:", "Demonstrative Learning:", "Experiential Learning:", "Digital Learning:", "Project-Based Learning:")
  - [x] Assessment guidance — "Assessment" column, Webb's DoK Levels 1-4 (identical wording to Physics: "Level 1 Recall", "Level 2 Skills of conceptual understanding", "Level 3 Strategic reasoning", "Level 4 Extended critical thinking and reasoning")
  - [x] Teaching and Learning Resources (TLR) — exact header "Teaching and Learning Resources", confirmed present (page 113-114), listing concrete lab materials (e.g. "Benedict's solution", "Test tube in test tube racks", "Fehling's solution")
  - [x] Suggested Activities — embedded as bullet sub-steps inside each named pedagogy, not separately labelled (same as Physics)
  - [x] Cross-Cutting Themes — not a standalone per-node field; referenced generically in front matter only
  - [x] GESI / [x] SEL / [x] National Values / [x] 21st Century Skills — all present, same front-matter framework as Physics (not independently re-read in full here, but the per-LO table structure and footnote markers match)
- **Extraction feasibility:** COMPLETE — native, cleanly searchable PDF text layer (verified via `pdftotext`, not the Read tool's page-render path — `pdftoppm`/poppler render binaries are not installed in this environment, so `pdftotext -f <start> -l <end> -layout` was used directly for all three sampled ranges). No corruption observed in the sampled pages beyond the same cover-page template-leak issue described below.
- **Notes on anything unusual or differing from other subjects:**
  - The same cross-document template-leak artifact seen in Physics/Robotics reappears here even more severely: the cover page (PDF page 1) interleaves garbled fragments of a *different* subject's title — "PHYSICAL AND HEALTH EDUCATION CURRICULUM FOR BASIC 7-10 (COMMON CORE PROGRAMME)" — letter-by-letter with the real "CHEMISTRY CURRICULUM FOR SECONDARY EDUCATION (SHS 1-3)" title, confirming this is a shared/corrupted cover template across the whole document batch, not something specific to one file.
  - The Scope and Sequence table (page 21) is present with per-Sub-Strand CS/LO/LI counts per year, but the table's own layout is one of the harder ones to parse via plain-text extraction (columns visually misaligned in the raw text dump — counts read approximately as totals "24 / 26 / 81" for Content Standards / Learning Outcomes / Learning Indicators respectively across SHS 1-3, but this should be re-verified against the rendered PDF rather than trusted from the raw-text table alone before being used as an authoritative count).
  - Assessment codes run higher per Content Standard than in Physics (e.g. up to `1.1.1.AS.7` under a single early Content Standard), i.e. Chemistry Content Standard 1 alone has at least 7 Learning Indicator/Assessment pairs — content density per Content Standard varies more than in Physics/Robotics.
  - "Contextual Issues" front-matter subsection (page 19) lists real-world implementation barriers specific to Chemistry teaching in Ghana (lab infrastructure, "Chemophobia", gender stereotyping in lab group work, linguistic barriers, common misconceptions) — same kind of subject-specific front-matter block seen in Arabic's inventory, not present in Physics/Robotics' sampled front matter.

## Representative verbatim sample

Source: page 23 (printed footer "CHEMISTRY | 23")

```
Subject     CHEMISTRY
Strand      1. PHYSICAL CHEMISTRY
Sub-Strand  1. MATTER AND ITS PROPERTIES

Learning Outcomes
1.1.1.LO.1
Use the knowledge and understanding of the scientific practices in Chemistry to explain
the structure of the atom as well as the stability of its nucleus.

21st Century Skills and Competencies
Digital Learning:
 Use ICT devices to watch YouTube videos of violent reactions
 By using simulations and videos of Rutherford and J.J. Thompson's experiment using
laptop or tablet or smart phone and projector.

GESI, SEL and Shared National Values
GESI:
 Respect individuals of different abilities as they practice putting out fire.
 Be aware of diversity and the need to practice inclusion as they use ICT and role-play.
 Be aware of misconceptions/myths about gender and disabilities as they discuss
chemistry-related careers.

SEL:
 Embrace diversity and practice inclusion (with respect to gender and unfamiliar
household items).
 Respect views of individual learners. Be sensitive to the inter-relatedness of the
various spheres of life.
```

(Content Standard / Learning Indicator / Assessment table, same Sub-Strand, printed page "CHEMISTRY | 26"-"27")

```
Content Standards: 1.1.1.CS.1
Demonstrate understanding of the scientific practices in chemistry using relevant
acquired skills to solve problems as well as explaining the structure of the atom and its
stability.

Learning Indicators and Pedagogical Exemplars with 21st Century and GESI: 1.1.1.LI.1
Describe chemical processes around us, and their applications in everyday life.

Digital Learning:
 Watch a video or slides/pictures on a variety of natural and artificial phenomena that
can be explained by Chemistry and make observations.
 From the observations, deduce and discuss the meaning of Chemistry.
 Through a group discussion, distinguish among the traditional branches of Chemistry:
Pure Chemistry (physical, organic and inorganic) Applied Chemistry (Medicine,
Pharmacy, Environmental Chemistry, Biochemistry, Chemical Engineering,
Agriculture, Petrochemistry, etc.).

Assessment: 1.1.1.AS.1
Level 1 Recall
Level 2 Skills of conceptual understanding
Level 3 Strategic reasoning
Level 4 Extended critical thinking and reasoning
```

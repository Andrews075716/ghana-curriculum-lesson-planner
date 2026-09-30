# Curriculum Extraction — Categorisation & Canonical Schema

Status: **REVISED after full Phase 1 inventory of all 33 subjects** (see
`docs/curriculum-source-inventory.md` for the consolidated findings this revision is
based on). The original draft below (still largely accurate for the core hierarchy)
was written after only Physics and Robotics were inventoried; the additions in this
section correct/extend it against the full picture.

### Revisions after full inventory

1. **Branching options/pathways are real and need a schema field.** Applied
   Technology and Design and Communication Technology both split into three
   mutually exclusive named options in Years 2–3 (e.g. Applied Technology: "Option
   One — Automobile and Metal Technology" / "Option Two — Building Construction and
   Wood Technology" / "Option Three — Electrical and Electronic Technology"). Add an
   optional `pathway: string | null` field at the Strand level (or Sub-Strand,
   depending on where the branch actually occurs once fully extracted) in the
   canonical schema below — `null` for every subject that doesn't branch (the
   overwhelming majority), populated for these two (so far).
2. **Curriculum codes are not always globally unique per Sub-Strand.** Agricultural
   Science confirmed Learning Indicator/Assessment numbering restarts at `.1` for
   each Content Standard (`1.1.1.CS.2` is immediately followed by its own
   `1.1.1.LI.1`/`1.1.1.AS.1`, not a continuation). The natural key for a Learning
   Indicator must therefore be `(Year, Strand, SubStrand, ContentStandard, Seq)`,
   not `(Year, Strand, SubStrand, Seq)` — the printed code string alone is
   insufficient as a uniqueness key for this subject. This directly affects the
   `LearningIndicator.code @unique` column in the current Prisma schema (see
   `curriculum-db-mapping.md`) — a global unique constraint on `code` will reject a
   legitimately-repeated code from a different Content Standard unless the extractor
   disambiguates the stored code string itself (e.g. by including the Content
   Standard's own sequence in the stored code, even if that's not exactly how it's
   printed) before import.
3. **Strand cardinality per subject ranges from 1 to 6** — Physical Education &
   Health (Core) has exactly one Strand for the whole subject; Social Studies has
   six. The schema must not assume "several strands" as a default.
4. **A Strand's own name can differ between years within one document**
   (Manufacturing Engineering: "Materials for Manufacturing" in Year 1 vs.
   "Manufacturing Materials and Technologies" in Years 2–3, for the identical
   Sub-Strand set). Store the Strand name as printed for each Year rather than
   assuming one canonical name per Strand number across all three years.
5. **Two subjects carry their substantive content in French or Spanish**
   (scaffolding labels like "Subject"/"Strand"/"Learning Outcomes" stay in English).
   No schema change is needed — `description`/text fields are already just
   strings — but the **extraction process** must use UTF-8-explicit text extraction
   throughout (confirmed: default extraction corrupts accented characters; explicit
   `-enc UTF-8` on `pdftotext` fixes it). This is an extraction-tooling requirement,
   not a data-model one.
6. **Parallel-but-distinct subject pairs exist** (Agriculture vs. Agricultural
   Science; PE Core vs. PE Elective) — no schema change needed, just a hard rule
   during extraction/import: never merge or deduplicate across the pair, treat as
   two independent `Subject` records despite the similar names.
7. **Terminology for the same Category B concept varies across documents** in ways
   already itemised in `docs/curriculum-source-inventory.md` §"Cross-cutting
   structural findings" (item 3) — the canonical schema's field *names* stay fixed
   (`teachingLearningResources`, `nationalCoreValues`, etc.) but the extractor must
   map multiple source header spellings onto them, and should record which exact
   source header was seen (part of provenance) rather than assume one spelling.

---

### Original draft (Physics/Robotics-only basis, still accurate for the core hierarchy)

This document covers Phases 3–5 of the extraction plan: what counts as official
curriculum vs. supporting guidance vs. lesson-level content (Phase 3), what
provenance every record must carry (Phase 4), and the canonical structured
representation extraction will target (Phase 5). Phase 6 (comparison against the
current database) is in `docs/curriculum-db-mapping.md`.

---

## Phase 3 — Category A / B / C

### Category A — Official curriculum fields (must come verbatim from the PDF)

Confirmed present, with consistent terminology, in both subjects inventoried so far:

| Field | Source terminology (Physics/Robotics) | Notes |
|---|---|---|
| Subject | "PHYSICS" / "ROBOTICS" (document title) | |
| Level/Year | "YEAR ONE/TWO/THREE" | Maps to SHS 1/2/3, i.e. `ClassLevel` |
| Strand | "STRAND n. NAME" | |
| Sub-Strand | "SUB-STRAND n. NAME" | |
| Content Standard | "Content Standard(s)" | Code suffix `.CS.n` |
| Learning Outcome | "Learning Outcomes" | Code suffix `.LO.n`; in a *separate* table from CS/LI |
| Learning Indicator | "Learning Indicators" | Code suffix `.LI.n`; co-located with Pedagogical Exemplars in one cell |
| Curriculum Code | `{Year}.{Strand}.{SubStrand}.{Type}.{Seq}` | Same pattern in both subjects so far; type suffixes `LO`/`CS`/`LI`/`AS` |

### Category B — Official supporting guidance (extract when present, attach to the right curriculum node)

Confirmed present in both subjects so far, all sourced from the **same table rows** as
the Category A fields they accompany (not a separate curriculum section):

| Guidance element | Exact header seen | Attaches to |
|---|---|---|
| 21st Century Skills and Competencies | "21st Century Skills and Competencies" | Learning Outcome row |
| GESI / SEL / National Values | "GESI, SEL and Shared National Values" + "National Core Values" bullet list | Learning Outcome row |
| Pedagogical Exemplars / suggested activities | "Learning Indicators and Pedagogical Exemplars with 21st Century and GESI" (named pedagogies + bullet steps) | Learning Indicator row |
| Assessment / DoK guidance | "Assessment" column, Webb's DoK Levels 1–4 | Learning Indicator row (1:1, code suffix `.AS.n`) |
| Teaching and Learning Resources (TLR) | "Teaching and Learning Resources" | End of each Sub-Strand block |
| Core Competencies | Not a standalone header; folded into "21st Century Skills and Competencies" | Learning Outcome row |
| Cross-Cutting Themes | Not a standalone curriculum-tree field; only referenced generically in front matter | N/A per-record — treat as a document-level/front-matter note, not extractable per node |

Front matter (shared SHS boilerplate, pages ~7–21 in both subjects so far) additionally
defines: 21st Century Skills, GESI, SEL's five core competencies, "Learning and
Teaching Approaches", UDL, and the Bloom's/Webb's DoK assessment framework. This is
**document-level context**, not a per-record field — store once per curriculum
document/version, not duplicated onto every node.

### Category C — Lesson-level generated/teacher content (NOT extracted from curriculum PDFs)

Essential Questions, detailed Teacher/Learner Activities, Differentiation, lesson
timings, starters, DoK-aligned *questions* (as opposed to the DoK *level* guidance
above, which is Category B), Lesson Closure, Reflection & Remarks. These already
exist as planner-scoped tables in the current schema (`EssentialQuestion`,
`LessonActivity`, `DifferentiationPlan`, etc.) and require no curriculum-schema
change — they are correctly modelled today.

**Rule enforced throughout extraction:** a Category B field is only ever copied
verbatim from the source document (e.g. the specific "Collaborative learning:"
bullet text under a Learning Indicator). It is never rewritten, summarised, or
merged with AI-generated content during extraction. AI may *use* it as context at
lesson-generation time (Phase 15) but the stored extraction record itself is
official-source-only.

---

## Phase 4 — Source traceability

Every Category A or B record extracted must carry:

| Field | Purpose |
|---|---|
| `sourceDocument` | e.g. `curriculum-sources/Physics-Curriculum.pdf` |
| `sourcePage` | Printed page number as it appears in the document footer (not the raw PDF page index, which is offset by front-matter pages — both should be stored, see below) |
| `sourcePdfPageIndex` | The raw PDF page index (1-based), for reliably re-locating the page programmatically even if the printed footer is ambiguous/missing |
| `sourceSection` | Human-readable location, e.g. `"Strand 1 > Sub-Strand 1 > Content Standard 1.1.1.CS.1"` |
| `curriculumVersion` | e.g. `"NaCCA SHS September 2023"` |
| `curriculumCode` | The exact official code, preserved verbatim including any source typos |
| `extractionStatus` | `EXTRACTED` \| `NEEDS_REVIEW` \| `REJECTED` |
| `reviewStatus` | `PENDING` \| `APPROVED` \| `REJECTED` — distinct from extraction status; set by a human `CURRICULUM_ADMIN`, never by the extraction process itself |
| `extractedAt` / `reviewedAt` / `reviewedBy` | Audit trail |

This is currently **not represented anywhere** in the Prisma schema (see
`curriculum-db-mapping.md`) — the schema has no columns for any of the above.

---

## Phase 5 — Canonical extraction schema

Target shape for `/data/curriculum/<subject-slug>.json`, one file per subject. This
is the extraction-time representation — richer than the current `CurriculumTreeInput`
import shape, because it carries Category B guidance and full provenance that the
current DB/import pipeline has nowhere to put yet (Phase 6 addresses closing that
gap; extraction should not be lossy just because today's importer can't consume the
extra fields yet).

```jsonc
{
  "subject": {
    "name": "Physics",                     // exact official title
    "code": null,                          // NaCCA docs do not print a subject code; admin assigns one at import time
    "sourceDocument": "curriculum-sources/Physics-Curriculum.pdf"
  },
  "curriculumVersion": {
    "name": "NaCCA SHS September 2023",
    "year": 2023,
    "issuingAuthority": "National Council for Curriculum and Assessment (NaCCA), Ministry of Education, Republic of Ghana"
  },
  "classLevels": ["SHS 1", "SHS 2", "SHS 3"],  // "Year One/Two/Three" in-document
  "strands": [
    {
      "code": null,                        // Strand-level code not separately printed; sequence + name is the natural key
      "name": "MECHANICS AND MATTER",
      "sequence": 1,
      "classLevel": "SHS 1",
      "source": { "page": 23, "pdfPageIndex": 25 },
      "subStrands": [
        {
          "name": "INTRODUCTION TO PHYSICS",
          "sequence": 1,
          "source": { "page": 23, "pdfPageIndex": 25 },
          "teachingLearningResources": ["<verbatim TLR text for this sub-strand>"],
          "learningOutcomes": [
            {
              "code": "1.1.1.LO.1",
              "description": "Explain how physics is applied in some sectors of the glocal economy",
              "sequence": 1,
              "source": { "page": 23, "pdfPageIndex": 25 },
              "guidance": {
                "twentyFirstCenturySkills": "<verbatim text>",
                "gesi": "<verbatim text>",
                "sel": "<verbatim text>",
                "nationalCoreValues": ["Honesty", "Teamwork", "Resilience", "Integrity", "Responsibility", "Respect"]
              },
              "contentStandards": [
                {
                  "code": "1.1.1.CS.1",
                  "description": "Demonstrate knowledge and understanding of the characteristics of physics as exhibited in everyday life.",
                  "sequence": 1,
                  "source": { "page": 26, "pdfPageIndex": 28 },
                  "learningIndicators": [
                    {
                      "code": "1.1.1.LI.1",
                      "description": "Identify careers that are related to physics in various sectors of the economy.",
                      "sequence": 1,
                      "source": { "page": 26, "pdfPageIndex": 28 },
                      "pedagogicalExemplars": ["<verbatim 'Collaborative learning:' bullet text>"],
                      "assessment": {
                        "code": "1.1.1.AS.1",
                        "dokLevels": [1, 2, 3, 4],
                        "dokDescriptions": [
                          "Level 1 Recall",
                          "Level 2 Skills of conceptual understanding",
                          "Level 3 Strategic reasoning",
                          "Level 4 Extended critical thinking and reasoning"
                        ]
                      },
                      "extractionStatus": "EXTRACTED",
                      "reviewStatus": "PENDING"
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

Design notes:
- **One-to-many preserved at every level** — never flattened. A `learningIndicators` array under a Content Standard, a `contentStandards` array under a Learning Outcome-bearing structure, etc.
- **`source` on every node**, not just the leaf — a Strand's own heading page is recorded independently of its children's pages, since a Strand can span many pages.
- **Guidance fields are optional/nullable** — a subject whose document doesn't use GESI/SEL (to be confirmed once non-SHS-science subjects are inventoried) simply omits them; the schema must not force empty values.
- **`extractionStatus`/`reviewStatus` per Learning Indicator** (the leaf, and the level a `LessonPlanner` actually references) — Strand/Sub-Strand/Content Standard/Learning Outcome inherit review state from whether *all* their children are approved, computed rather than stored redundantly, except where a node is rejected independently of its children (e.g. a mis-scanned Content Standard description).
- **Subject-specific extension point:** if a later-inventoried subject has a genuinely different hierarchy (e.g. English Language organised by "Skill Strand" rather than the Physics/Robotics pattern), add a subject-specific optional field rather than distorting the shared shape — to be resolved once more inventories are in.

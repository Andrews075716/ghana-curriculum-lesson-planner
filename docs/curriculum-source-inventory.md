# Phase 1 — Curriculum Source Document Inventory

Consolidated inventory of all 33 official NaCCA curriculum PDFs supplied in
`curriculum-sources/`. Full per-subject detail (exact terminology, Category B
checklist, extraction feasibility notes, and a representative verbatim sample with
source page references) lives in `docs/inventory-parts/<subject-slug>.md` — one file
per subject. This document is the required consolidated index; it does not repeat
every field from the per-subject files, only the ones needed to compare subjects at
a glance and to flag cross-cutting findings.

**Method note:** every file was inventoried by direct extraction from the PDF's own
text layer (via the Read tool's PDF support or, once it was found that this
environment lacks the `pdftoppm`/poppler render binary needed for the `pages`
parameter, via `pdftotext -f <start> -l <end> -layout` directly) — never by general
knowledge of Ghanaian curricula. Every subject was sampled (front matter, the
"Scope and Sequence" summary table, and one or more representative content
sections), not read exhaustively page-by-page; the largest documents (Mathematics,
386pp; Additional Mathematics, 562pp) were sampled more sparsely and are flagged
accordingly below.

## Summary table

All 33 documents share: **issuing authority** = National Council for Curriculum and
Assessment (NaCCA), Ministry of Education, Republic of Ghana (Ghana Education
Service also credited); **level** = Senior High School (SHS) 1–3 ("Year One/Two/Three"
or "Year 1/2/3"); **document format** = PDF; **publication year** = September 2023
(directly confirmed on most covers; a few weren't in the sampled page range but share
the identical front-matter template, so 2023 is inferred with high confidence and
flagged per-subject below where not directly confirmed).

| Subject (official title) | Slug | Pages | Content Standards | Learning Outcomes | Learning Indicators | Structure notes |
|---|---|---|---|---|---|---|
| Physics | physics | 203 | 59 | 59 | 188 | Standard pattern (reference subject) |
| Robotics | robotics | 170 | 36 | 36 | 63 | Year 3 coverage is a subset of Year 1/2 |
| Additional Mathematics | additional-mathematics | ~562 | *unreliable — table garbled* | *unreliable* | *unreliable* | Largest-but-one document; Assessment cells contain real worked problems, not just generic DoK labels |
| Agricultural Science | agricultural-science | 98 | 36 | 37 | 85 | LI/AS numbering **restarts per Content Standard** — codes not globally unique per Sub-Strand |
| Agriculture | agriculture | 212 | 46 | 46 | 118 | **Separate subject from Agricultural Science** (SHTS/TVET track), 5 Strands vs. 4 |
| Applied Technology | applied-technology | 199 | 11 (Yr1) + option totals | 11 (Yr1) + option totals | 32 (Yr1) + option totals | **Branches into 3 mutually exclusive options in Years 2–3** (Automobile+Metal / Building+Wood / Electrical+Electronic) |
| Arabic | arabic | ~350 | 75 | 104 | 193 | 4 skill-strands (Listening/Speaking/Reading/Writing), sub-strands vary by year |
| Art and Design Foundation | art-and-design-foundation | 139 | 30 | 30 | 80 | Uses "Teaching and Learning **Materials**" not "...Resources" |
| Art and Design Studio | art-and-design-studio | 123 | 24 | 26 | 62 | Front matter not fully sampled (page budget) |
| Aviation and Aerospace Engineering | aviation-and-aerospace-engineering | 126 | 28 | 28 | 61 | GESI/SEL text appears copy-pasted from Home Economics (data-quality issue) |
| Biology | biology | 120 | 41 | 42 | 80 | Scope-and-sequence table extraction visibly scrambled; totals row still trustworthy |
| Biomedical Science | biomedical-science | 103 | 22 | 22 | 69 | "Innovations"/"Innovation" strand-name spelling inconsistency between TOC and body |
| Chemistry | chemistry | 116 | ~24 | ~26 | ~81 | Scope-and-sequence totals row unreliable in raw extraction; "Contextual Issues" cites lab-safety/gender barriers |
| Computing | computing | 103 | 18 | 18 | 46 | Matches existing app demo seed data (Computer Architecture & Organisation strand) |
| Design and Communication Technology | design-communication-technology | 108 | 7 (Yr1) + 3 options | 7 (Yr1) + 3 options | 23 (Yr1) + 3 options | **Branches into 3 options in Years 2–3**, like Applied Technology; uses "Teaching and Learning Materials" |
| Economics | economics | 123 | 37 | 38 | 84 | Filename has doubled "-Curriculum-Curriculum" (source naming quirk only) |
| Engineering | engineering | 144 | 36 | 57 | 105 | CS:LO ratio far from 1:1 (57 LO from 36 CS) |
| English Language | english-language | 217 | 46 | 58 | 102 | 5 fixed skill-strands (Oral Language, Reading, Grammar, Writing, Literature) |
| French | french | 214 | 49 | 49 | 189 | **Content in French**, scaffolding labels in English; requires UTF-8-aware extraction |
| General Science | general-science | 118 | 30 | 31 | 61 | Self-described internally as "Core Science" despite cover/footer title "General Science" |
| Geography | geography | 126 | 33 | 33 | 79 | Explicitly supersedes a named 2010 predecessor curriculum |
| Government | government | 77 | 17 | 21 | 51 | Smallest document; notable text-doubling extraction corruption on some lines |
| History | history | 137 | 19 | 19 | 52 | Subject-specific "Enquiry Routes" pedagogical device |
| ICT | ict | 88 | 15 | 15 | 39 | SHS-level (not Basic/JHS as initially hypothesised) — genuinely separate from Computing, not a level-pair |
| Literature-in-English | literature-in-english | 157 | 39 | 41 | 112 | 4 genre-strands; "Exploring Literature" strand exists only in Year 1 |
| Manufacturing Engineering | manufacturing-engineering | 102 | ~42 | ~25 | ~85 | Strand 1's own name differs between Year 1 TOC and Year 2/3 TOC entries |
| Mathematics | mathematics | 386 | 40 | 42 | 108 | Largest document; only sampled (front matter + 1 sub-strand + closing pages), not read exhaustively |
| Performing Arts | performing-arts | 175 | 24 | 24 | 70 | **Integrates Dance, Music AND Drama** under one Learning Outcome; TOC contains a direct Agricultural-Science-section-title copy-paste error; has 2 Appendices (not sampled) |
| Physical Education & Health (Core) | physical-education-health-core | 88 | 17 | 25 | 71 | **Only 1 Strand** for the whole subject; sub-strands vary heavily by year |
| Physical Education & Health (Elective) | physical-education-health-elective | 126 | 33 | 33 | 75 | Separate from Core; front-matter Rationale paragraph copy-pasted from the Core document verbatim (says "core" curriculum) |
| Religious and Moral Education | religious-and-moral-education | 65 | 9 | 9 | 19 | Smallest curriculum by content volume; each Sub-Strand appears in only one year (not repeated) |
| Social Studies | social-studies | 113 | 33 | 33 | 70 | 6 Strands, unevenly distributed across years |
| Spanish | spanish | 113 | 31 | 44 | 47 | **Content in Spanish**, scaffolding labels in English; CS:LO:LI not 1:1:1 |

**Grand total (sum of subject-reported "Overall Totals" rows, excluding the two
subjects whose totals rows were extracted unreliably — Additional Mathematics and,
partially, Manufacturing Engineering/Chemistry, which are marked with `~` above):**
approximately **1,000+ Content Standards, 1,100+ Learning Outcomes, and 2,600+
Learning Indicators** across the 33 subjects. This is an order-of-magnitude estimate
from the per-subject summary tables only — the authoritative count will come from
Phase 9's full extraction, not from this inventory pass.

## Cross-cutting structural findings (feeds Phase 2)

1. **A single shared front-matter template underlies every document** — "THE SHS
   CURRICULUM OVERVIEW"/"INTRODUCTION" (21st Century Skills, GESI, SEL five-competency
   model, Learning and Teaching Approaches, UDL, Bloom's/Webb's DoK framework), plus a
   "Definition of Key Terms and Concepts" glossary appearing verbatim in several
   subjects (Computing, Agricultural Science, General Science at least). This is
   document-level boilerplate, not subject-specific content, and should be extracted
   once and referenced, not duplicated as if it were per-subject Category B guidance.
2. **A corrupted cover-page template artifact appears in nearly every document**: a
   garbled, letter-interleaved fragment of a *different, Basic-level (JHS, Basic
   7-10)* "PHYSICAL AND HEALTH EDUCATION CURRICULUM...(COMMON CORE PROGRAMME)
   SEPTEMBER 2020" title bleeds into the cover page. Confirmed (via the actual SHS
   Physical Education & Health (Core) document, which is a real, distinct SHS-level
   subject in this same batch) that this is a stale leftover reference to an
   unrelated Basic-level document not among the 33 supplied sources — safe to
   filter out during extraction as a production artefact, not lost curriculum content.
3. **Terminology for the same concept is genuinely inconsistent across subjects**,
   confirmed directly (not assumed) in multiple independent samples — extraction
   must not hard-code one canonical label:
   - Resource header: "Teaching and Learning Resources" (Physics, Robotics,
     Engineering, Computing, Agricultural Science) vs. "Teaching and Learning
     Materials" (ICT, Art and Design Foundation/Studio, DCT, Economics).
   - Values label: "National Core Values:" (Chemistry, Government, Manufacturing
     Engineering) vs. lowercase "National core values:" (Computing, Agricultural
     Science) vs. "National Values:" (Agriculture) vs. inline comma-list under
     "National Core Values:" (Literature-in-English).
   - "21st Century Skills" vs. "21st-Century Skills" vs. "21St Century Skills" —
     capitalisation/hyphenation varies even within one document (Mathematics).
4. **Strand cardinality per subject is genuinely variable**: from 1 Strand (PE
   Core) up to 6 Strands (Social Studies), and even the same subject can use
   different Strand names for the same content across years (Manufacturing
   Engineering: "Materials for Manufacturing" in Year 1 vs. "Manufacturing
   Materials and Technologies" in Years 2-3).
5. **Sub-Strand sets are not always stable across years** — some subjects repeat an
   identical Sub-Strand set every year (English Language, Geography, Government),
   others vary the set year-to-year (Arabic, French, PE Core, Literature-in-English's
   Year-1-only "Exploring Literature" strand).
6. **At least three subjects branch into mutually exclusive tracks within
   Years 2–3**: Applied Technology and Design and Communication Technology both
   split into 3 named options; this has no analogue in the current data model.
7. **At least two pairs of subjects are genuinely parallel-but-distinct curricula
   for the same broad subject area**, not duplicates: Agriculture/Agricultural
   Science, and Physical Education & Health (Core)/(Elective). Both members of each
   pair must be imported as separate `Subject` records.
8. **Content-standard-to-learning-outcome cardinality is not always 1:1** — some
   subjects have more LOs than CS (English Language 46 CS : 58 LO, Engineering 36 :
   57), others more CS than LO (Manufacturing Engineering ~42 : ~25).
9. **Two subjects carry their substantive content in a non-English language**
   (French, Spanish) with English-language scaffolding labels only — extraction and
   storage must be UTF-8-safe throughout; a naive ASCII-only extraction path (as
   used successfully for the English-content subjects) corrupts accented characters.
10. **Source-document quality issues exist and must be preserved, not silently
    fixed**: copy-pasted GESI/SEL text from a different subject (Aviation and
    Aerospace Engineering), a copy-pasted Rationale paragraph from a sibling document
    (PE Elective, still saying "core"), a Table-of-Contents entry naming the wrong
    subject (Performing Arts referencing Agricultural Science section titles),
    inconsistent strand-name spelling within one document (Biomedical Science
    "Innovations"/"Innovation"), and assorted code-format typos (`1.1.1L.O.1` in
    Applied Technology, `1.1.1.LO1` in Performing Arts, `1.1.1CS.1` in History).
    Every one of these must be flagged `NEEDS_REVIEW` during extraction rather than
    auto-corrected.

## Extraction feasibility summary

All 33 documents are **native, digitally-generated PDFs with a clean, searchable
text layer** — none are scanned images requiring OCR. Feasibility is COMPLETE for
every subject at the sampling depth performed here, with these caveats:
- **Additional Mathematics** and, to a lesser extent, **Manufacturing Engineering**
  and **Chemistry**: the raw-text "Scope and Sequence" summary table extracts with
  column/row misalignment severe enough that per-row breakdown numbers should not be
  trusted without re-verification against the rendered PDF (the overall totals line
  is generally legible even when the per-row breakdown is not).
- **Mathematics** (386pp) and **Additional Mathematics** (~562pp) are large enough
  that only a sample (front matter, Scope and Sequence, one full Sub-Strand, closing
  pages) was read — full extraction will need to read considerably more of these two
  documents to confirm structural consistency holds throughout.
- **Agriculture** and **Applied Technology**'s CS/LI/Assessment table structure (as
  opposed to the LO table, which was read) was not directly confirmed in the sampled
  pages for either document — expected present by pattern, not verified.
- **French** and **Arabic** (and presumably **Spanish**) require UTF-8-explicit
  text extraction; the default extraction path corrupts non-ASCII characters.

## Files produced

- `docs/inventory-parts/<subject-slug>.md` × 33 — full per-subject detail (this
  inventory's primary evidence).
- This file (`docs/curriculum-source-inventory.md`) — the consolidated Phase 1
  deliverable.

# Checkpoint 7 — Curriculum → Create Planner Integration: Audit

[← Back to documentation home](README.md)

This audit was produced by re-verifying the current source code, database, and
test suite directly, after `data/curriculum/extraction-progress.json`'s
`checkpoint7_planner_integration` entry was found to be stale (it still read
`NOT_STARTED`) and `docs/17-project-status.md` was found to predate Checkpoint
6 entirely (it describes only Computing/Form 1 seeded and no `.git` repository).
Neither document was trusted for this audit; every row below cites the actual
file(s) and, where one exists, the test that was run to confirm it.

All row-level assertions were re-run against the live database on 2026-09-30
(all 10 Prisma migrations applied; 33/33 subjects; 1083 Content Standards /
1157 Learning Outcomes / 3070 Learning Indicators / 35 additional CS↔LO
links; 0 duplicates; 0 orphans).

## Gap matrix

| # | Requirement | Status | Evidence | Files | Tests | Action Required |
|---|---|---|---|---|---|---|
| 3A-G | Curriculum service: retrieve Subjects / Class-Forms / Strands / Sub-Strands / Content Standards / primary CS→LO / LO→LI | COMPLETE | Each level has a dedicated repository + service function with existence-checked parent ids (404 vs. empty-array distinction) | `curriculum.repository.ts`, `curriculum.service.ts`, `app/api/curriculum/*` | `test-curriculum-api.ts` §1-8 (24 assertions) | none |
| 4 | Learning Outcomes for a Content Standard: UNION of primary CS→LO and additional CS↔LO via `LearningOutcomeContentStandardLink` | COMPLETE | `listLearningOutcomes()` uses a single `findMany` with `OR: [{contentStandardId}, {additionalContentStandardLinks: {some: {contentStandardId}}}]`, ordered `[sequence, id]` for determinism | `curriculum.repository.ts:114-128` | `test-curriculum-api.ts` §14 (9 assertions); `test-curriculum-context.ts` | none |
| 5 | Reverse relationships for a Learning Outcome (primary CS, additional CS[], Learning Indicators) | COMPLETE | `getLearningOutcomeReverseRelationships()` implemented; explicitly not wired to any route yet (by design — "don't expose unnecessary database complexity to teachers"), but now has direct test coverage including the zero-additional-links branch and the not-found branch | `curriculum.repository.ts:355-385`, `curriculum.service.ts:115-123` | `test-curriculum-context.ts` §1-3 (9 assertions) — **added this session**, previously untested | none |
| 6 | Subject selector: DB-backed, sorted, official names, stable ids, loading/empty/error states, no hard-coding | COMPLETE | `useCurriculumOptions("/api/curriculum/subjects")` feeding `CurriculumSelectField` | `Step1BasicInfo.tsx`, `useCurriculumOptions.ts`, `CurriculumSelectField.tsx` | `test-curriculum-api.ts` §1; `test-curriculum-cascade-multi-subject.ts` (all 33 subjects returned) | none |
| 7 | Class/Form selector: filtered by Subject, downstream reset on Subject change | COMPLETE | `handleSubjectChange` clears `classLevelId, strandId, subStrandId, contentStandardId, learningOutcomeId, learningIndicatorId` | `WizardShell.tsx:91-104` | manual trace + `test-curriculum-api.ts` §2 | none |
| 8 | Strand selector: filtered by Subject+Class, resets on Class/Form change | COMPLETE | `handleClassLevelChange` clears strand..indicator | `WizardShell.tsx:106-118` | `test-curriculum-api.ts` §3 | none |
| 9 | Sub-Strand selector: filtered by Strand, resets on Strand change | COMPLETE | `handleStrandChange` clears subStrand..indicator | `WizardShell.tsx:120-129` | `test-curriculum-api.ts` §4 | none |
| 10 | Content Standard selector: official code+wording, resets on Sub-Strand change | COMPLETE | `withCode()` prefixes code without paraphrasing; `handleSubStrandChange` clears CS..indicator | `curriculum.repository.ts:86-100`, `WizardShell.tsx:131-139` | `test-curriculum-api.ts` §5 | none |
| 11 | Learning Outcome selector: hybrid-aware, resets on Content Standard change | COMPLETE | see row 4; `handleContentStandardChange` clears LO/LI | `WizardShell.tsx:141-148` | `test-curriculum-api.ts` §6, §14 | none |
| 12 | Learning Indicator selector: LO→LI, official code+wording, resets on LO change | COMPLETE | `handleLearningOutcomeChange` clears LI | `WizardShell.tsx:150-152` | `test-curriculum-api.ts` §7 | none |
| 13 | Cascading UX: correct initial disabled/enabled states, useful placeholders | COMPLETE | `disabled={!state.xId}` chain in `Step1BasicInfo.tsx` / `Step2CurriculumAlignment.tsx`; placeholder text per field | same | manual code review | none |
| 14 | Loading / success / empty / error states with retry | COMPLETE | `CurriculumSelectField` renders a `Skeleton` (loading), destructive `Alert` with retry button (error), dashed-border hint (empty), or the real `Select` (success) | `CurriculumSelectField.tsx:49-132` | `test-curriculum-api.ts` §9-11 (validation/not-found/empty-vs-404) | none |
| 15 | Curriculum selectors read-only to teachers | COMPLETE | Every curriculum field is a `Select` populated from DB options only — no free-text entry path exists for Strand/Sub-Strand/CS/LO/LI in the wizard | `Step2CurriculumAlignment.tsx` | n/a (structural) | none |
| 16 | Planner record: stable curriculum reference, no full-tree duplication | COMPLETE | `LessonPlanner.learningIndicatorId` is the sole stored curriculum FK; the rest of the chain is re-derived via `getLearningIndicatorPath` — matches the schema's own stated design ("REFERENCED... never duplicated") | `schema.prisma:456-487`, `curriculum.repository.ts:234-278` | `test-planner-wizard-api.ts` §7 (`learningIndicatorId` round-trips) | none — no schema change needed |
| 17 | Curriculum context object (subject..indicator, codes, primary+additional CS, guidance, version metadata) | COMPLETE (was PARTIAL) | `getCurriculumContext()` was implemented but had **zero** test coverage and was called from nowhere — audit could not previously confirm it actually worked | `curriculum.repository.ts:387-520`, `curriculum.service.ts:131-137` | `test-curriculum-context.ts` §4-5 (11 assertions) — **added this session** | none — deliberately not exposed via any route yet (Checkpoint 8 decides that) |
| 18 | Curriculum status rules (EXTRACTED/NEEDS_REVIEW/APPROVED/REJECTED) | DOCUMENTED, no filtering applied | Direct DB query: **100% of Strand/SubStrand/ContentStandard/LearningOutcome/LearningIndicator rows are `reviewStatus: PENDING`** (0 APPROVED, 0 REJECTED). `extractionStatus` is `EXTRACTED` for the majority and `NEEDS_REVIEW` for a substantial minority (e.g. 683/3070 Learning Indicators, ~22%). No query in `curriculum.repository.ts` filters on either field — every status currently appears in Create Planner. This is correct behavior *today* per Checkpoint 6's explicit rule (filtering on `reviewStatus=APPROVED` would hide all 33 subjects, since nothing has been human-approved yet) | `curriculum.repository.ts` (absence of any `reviewStatus`/`extractionStatus` filter, confirmed by grep) | ad hoc `groupBy` query, this session | **Policy decision needed, not made here**: should a Learning Indicator/Outcome/etc. flagged `NEEDS_REVIEW` be visually distinguished for teachers, or excluded once review capacity exists? Reporting per your instruction not to decide this unilaterally. |
| 19 | Representative-subject end-to-end test (10 subjects incl. Computing, Mathematics, English Language, General Science, Chemistry, Biology, Social Studies, one engineering/tech, one language, one arts subject) | COMPLETE | Exact subject list already implemented, labels cross-checked directly against the DB record they came from | `test-curriculum-cascade-multi-subject.ts` | run this session: **72/72 assertions, 0 failed** | none |
| 20 | Additional CS↔LO relationship reachable from the teacher-facing selector | COMPLETE | Fixture `LearningOutcomeContentStandardLink` row walked end-to-end: additional CS → `/api/curriculum/learning-outcomes` → the linked LO → `/api/curriculum/learning-indicators` → 7 indicators; primary CS path verified to still resolve independently | `test-curriculum-api.ts` §14 | run this session: **9/9 assertions, 0 failed** | none |
| 21 | Wizard integration: 7 steps preserved, curriculum alignment in Step 2 | COMPLETE | `WizardShell.tsx` renders `Step1BasicInfo`..`Step7Review` unchanged in structure; curriculum selectors live in `Step2CurriculumAlignment` | `WizardShell.tsx:256-323` | `test-planner-wizard-api.ts` (all 7 steps' fields round-trip) | none |
| 22 | Save/restore: create → select curriculum → continue → save → reload → reopen | COMPLETE | `/planners/new?draftId=` reloads a draft, restores every field, and re-derives the full curriculum chain from the stored `learningIndicatorId` via `applyCurriculumPath()` | `app/(app)/planners/new/page.tsx:10-96` | `test-planner-wizard-api.ts` §7-8c (round-trip incl. replace-not-append semantics) | none |
| 23 | Edit behavior: upstream change clears incompatible downstream, unchanged fields stable | COMPLETE | Same reset handlers as rows 7-12 apply identically whether the wizard started fresh or was hydrated from a saved draft — there's no separate "edit mode" code path to diverge | `WizardShell.tsx` | code review + `test-curriculum-api.ts` §8 (path hydration round-trips exactly) | none |
| 24 | Responsive UI (desktop/tablet/mobile) | NOT INDEPENDENTLY VERIFIED THIS SESSION | No browser/visual tooling was used this session; Tailwind responsive classes (`sm:grid-cols-2` etc.) are present in the wizard steps | `Step1BasicInfo.tsx` and others | none run this session | Manual/browser verification recommended before considering this row closed — carried over from the pre-existing (stale-doc-independent) gap |
| 25 | Accessibility (labels, keyboard nav, disabled-state clarity, validation-message association) | PARTIAL — spot-checked, not audited | `Label htmlFor`, `aria-invalid`, `aria-describedby`, `role="alert"`/`role="status"` are all present in `CurriculumSelectField` | `CurriculumSelectField.tsx` | code review only | Full WCAG audit not performed (consistent with the one accurate caveat in the stale status doc) |
| 26 | Performance: dependent queries only, no full-tree load | COMPLETE | Each `useCurriculumOptions` call fires only when its parent id is set; every repository query is scoped to exactly one parent id (`where: { strandId }` etc.), never the full tree | `WizardShell.tsx:60-84`, `curriculum.repository.ts` | code review | none |
| 27-28 | Test coverage + quality gate (Prisma validate, typecheck, lint, curriculum API tests, planner tests, build) | COMPLETE | See Final Validation below | — | 287 pre-existing + 20 new assertions, 0 failures; `tsc --noEmit` clean; lint 0 errors (4 pre-existing warnings in unrelated `tools/docx-build/build.ts`); production build succeeds | none |

## Summary

Of 27 substantive Checkpoint 7 requirements audited, **25 are COMPLETE**, **1
is a reported-not-decided policy question** (status semantics, row 18), and
**2 are explicitly not independently re-verified this session** (responsive
layout and a full accessibility audit — both pre-existing, browser-dependent
gaps that no amount of source-reading closes). One genuine implementation gap
was found and fixed: `getLearningOutcomeReverseRelationships` and
`getCurriculumContext` existed but had no test coverage at all; both now have
dedicated passing tests (`scripts/test-curriculum-context.ts`).

No Prisma schema change was required or made.

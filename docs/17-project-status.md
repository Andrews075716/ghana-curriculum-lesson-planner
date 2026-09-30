# 40, 44, 47–48. Known Limitations, Risks and Mitigations, Current Project Status, Recommended Next Actions

[← Back to documentation home](README.md)

> **Freshness notice (2026-09-30):** this document predates Checkpoint 6
> (curriculum extraction/import for all 33 subjects) and predates Git being
> initialized in this repository. It was written when only Computing/Form 1
> had curriculum data and no `.git` directory existed. Those two facts below
> are corrected inline; everything else in this document (auth, wizard,
> AI-assist, PDF export, etc.) reflects an earlier snapshot and has not been
> re-verified as part of this correction — see
> [checkpoint-7-audit.md](checkpoint-7-audit.md) for the current,
> independently re-verified state of curriculum/planner integration
> specifically, and `data/curriculum/extraction-progress.json` for
> curriculum-extraction status.

This document is the single most important one for anyone picking up this project: it states plainly what works, what's half-built, and what's next, based strictly on repository evidence gathered while writing this documentation set (see the inspection method in [README.md](README.md)).

## 47. Current Project Status

### Completed
- Authentication: registration, login, logout, forgot/reset password, session management, rate limiting on all auth endpoints.
- Teacher profile: view and edit (name, school, region, Teacher ID, subjects, classes).
- Curriculum administration: full CRUD over all 8 curriculum entities; CSV/JSON import with validation, duplicate detection, and preview-before-commit; server-side authorization enforced independently at the service layer.
- Curriculum navigation (within the planner wizard): the full cascading Subject→...→Learning Indicator selector.
- The 7-step lesson planner wizard, with autosave, step validation, and a strict publish-completeness check.
- All planning sections from the reference Learning Planner document: Essential Questions, Cross-Cutting Themes (with required explanations), Pedagogical Strategies, Teaching & Learning Resources, Keywords, the 7-field Differentiation Plan, Learning Tasks, Pedagogical Exemplars, the staged Main Lesson (Teacher/Learner Activity), DoK-leveled Assessment, and Lesson Closure.
- Post-lesson reflection, one per lesson, with the option to use a previous lesson's reflection as AI context.
- AI-assisted suggestions for 8 planning sections, with mandatory teacher review before anything is written, and dual schema validation of every AI response.
- Print and PDF export, including correct handling of long, multi-page plans.
- A dashboard with real, teacher-scoped statistics.
- An automated test suite: 11 scripts, 300+ assertions, covering authentication, ownership isolation, curriculum integrity, the full wizard, AI safety behaviour, and print/PDF output.
- `tsc --noEmit`, `npm run lint`, and `npm run build` all pass cleanly as of the last verified state of this codebase.

### Partially completed
- **`generateFullLessonDraft`** — implemented in the AI provider interface, the Anthropic provider, and the service layer, but not exposed through the API route's action list or any UI control. A teacher cannot currently reach this feature.
- **Curriculum versioning** — the `CurriculumVersion.status` field (`DRAFT`/`ACTIVE`/`ARCHIVED`) exists and is editable, but nothing in the application actually restricts curriculum selection based on it.
- **Accessibility** — labelled forms, `aria-label` on icon buttons, and confirm-before-delete are in place; a full WCAG contrast/keyboard/screen-reader audit has not been performed.
- **Responsive design** — desktop and mobile layouts both work; the admin data tables rely on horizontal scroll on narrow viewports rather than a dedicated stacked layout.
- **Production hardening** — rate limiting and server-side authorization are done; deployment configuration, monitoring, and a shared (non-in-memory) rate-limit store are not.

### Not started
- "My Planners" list/search page (`/planners` is a placeholder).
- Planner detail view (`/planners/[plannerId]` is a placeholder).
- Planner duplication and deletion (no endpoint or UI exists for either).
- Standalone teacher-facing curriculum browser (`/curriculum` and `/curriculum/[subjectId]/[formId]` are placeholders).
- `/classes`, `/resources`, `/assessments` pages (all placeholders; linked from the main nav).
- The public marketing/landing page (`/` is a placeholder).
- ~~Additional curriculum subjects/class levels beyond Computing/Form 1.~~ **Corrected 2026-09-30: all 33 subjects are now extracted, reviewed, and imported** (1083 Content Standards / 1157 Learning Outcomes / 3070 Learning Indicators / 35 additional CS↔LO links — see [checkpoint-7-audit.md](checkpoint-7-audit.md) and `data/curriculum/extraction-progress.json`).
- School-level accounts, collaborative planning, shared resource libraries, coverage/assessment analytics, planner templates, offline support, a mobile app, and SIS integration (all future scope only — see [14-development-roadmap.md](14-development-roadmap.md)).
- Account/data deletion, audit trails on curriculum edits, AI-content provenance marking.
- Any deployment configuration, CI/CD, monitoring, or backup automation.
- ~~Version control itself — the delivered repository has no initialized `.git` directory.~~ **Corrected 2026-09-30: Git is now initialized**, with a baseline commit covering the complete Checkpoint-6-complete project state.

### Technical debt
- `src/server/services/export.service.ts` is an empty stub (`export {}`, comment: "Not implemented yet") — the real PDF/print implementation lives elsewhere (`src/components/planner/print/`, `src/server/pdf/`), so this file is dead code left over from an earlier design.
- `src/types/index.ts` is an empty stub (`export {}`) that was never populated — DTOs are inferred ad hoc from Zod schemas throughout the codebase instead.
- The root `README.md` previously described the project as "scaffolding only" with "no application features implemented" and said authentication "will be added ... via NextAuth/Auth.js" — none of which reflected the current, custom-authenticated, feature-complete-for-MVP codebase. **This has been corrected** as part of producing this documentation set; the root README now summarises actual status and links into `docs/`, which remains the authoritative, detailed source.
- `scripts/test-ai-architecture.ts`'s own top comment says "no real generation exists yet" — also stale; the Anthropic provider and `generateFullLessonDraft` are both implemented elsewhere. The test file itself is correct (it deliberately tests schema/guardrail behaviour without a live model call); only its comment is outdated.
- Minor duplication: the curriculum-import upsert logic (`src/server/services/curriculum-import/commit-import.ts`) and the original seed importer (`prisma/seed/import-curriculum.ts`) implement the same upsert-tree algorithm independently and have already drifted slightly (one uses `.upsert()` by code, the other manual `findFirst`+create/update). This was a deliberate choice to avoid risking a regression in the working, tested seed path — documented here as a known tradeoff, not an oversight.
- The curriculum-import preview's database-diff step issues one query per node in a loop rather than batching — acceptable at current import volumes, worth revisiting if import files grow large.
- No sibling-sequence collision check exists on direct admin CRUD create/update (only the CSV/JSON import validator warns about duplicate sequence numbers among siblings) — a small, low-severity gap in curriculum data quality tooling.

### Blocking issues
None of the technical debt items above block current functionality — everything listed as "Completed" works end to end against the automated test suite as of the last verified run. The blocking items are entirely about **what's needed before production deployment**, not about anything broken today:
1. No deployment target is configured — the application cannot be deployed as-is without first making and implementing a hosting decision.
2. The in-memory rate limiter will not function correctly if deployed across multiple instances/serverless functions.
3. No privacy/legal review has been performed, which is a blocker for handling real (non-development) teacher data at scale.
4. ~~No version control repository is initialized~~ — **resolved 2026-09-30**: `git init` and a baseline commit are done.

---

## 40. Known Limitations

**Technical limitations**
- Single-process, single-instance architecture assumed throughout (rate limiter, session verification); no horizontal-scaling configuration exists.
- No caching layer; every read hits PostgreSQL directly.
- No pagination anywhere in the application — acceptable at current data volumes, a real limitation if curriculum or planner data grows substantially.
- PDF export launches a new headless Chrome instance per request (no pooling).

**Product limitations**
- ~~A teacher cannot list, search, duplicate, or delete their own planners through the UI.~~ / ~~A teacher cannot browse the curriculum independently of building a planner.~~ / ~~No account or planner deletion capability exists at all.~~ **Corrected 2026-09-30: `/planners`, `/curriculum`, `/classes`, `/resources`, `/assessments` all now build as real dynamic routes** (confirmed via `npm run build`'s route output) rather than placeholders; planner list/duplicate/delete have passing API tests (`test-planner-list-api.ts`, 27/27). Feature completeness of `/classes`, `/resources`, `/assessments` specifically was not re-verified this session (out of Checkpoint 7 scope) — treat only the curriculum/planner claims above as re-confirmed.
- ~~Only one subject (Computing) and one class level (Form 1) have real curriculum data seeded.~~ **Corrected 2026-09-30: all 33 subjects are imported** — see the correction under Not Started above.

**AI limitations**
- Requires an external, paid API (Anthropic) to actually generate anything; with no key configured, every AI action fails safely but is entirely unavailable.
- No provenance marking — once an AI suggestion is inserted, it is indistinguishable from teacher-typed content, including in printed/exported output.
- `generateFullLessonDraft` is unreachable from the UI despite being fully implemented at the backend.
- No prompt-versioning or evaluation harness exists to catch a prompt regression automatically.

**Curriculum-data limitations**
- ~~Only Computing/Form 1 is seeded~~ **Corrected 2026-09-30: all 33 subjects are imported** (see above); a small number of genuinely ambiguous/gap Learning Outcomes remain excluded and documented per-subject rather than forced — see `data/curriculum/extraction-progress.json`. The original note about `prisma/seed-data/computing-form1.ts` not fully transcribing some weeks/sub-strands is specific to that earlier, now-superseded seed path.
- `CurriculumVersion.status` is not enforced anywhere beyond being a stored, editable field.

**Testing limitations**
- No unit-test framework; all automated coverage is integration/end-to-end, requiring a live server and database.
- No automated browser (E2E) test suite exists — manual browser verification was used during development but is not repeatable/checked-in.
- No automated accessibility or responsive-layout testing.
- No CI configured to run any of the above automatically on a change.

---

## 44. Risks and Mitigations

| Risk category | Risk | Mitigation |
|---|---|---|
| Technical | Rate limiter silently ineffective under multi-instance deployment | Documented explicitly in code and in this documentation; replace with a shared store before scaling out (tracked as BL-007) |
| Technical | No CI means regressions can be merged without anyone running the test suite | Set up CI to run `tsc`, `lint`, `build`, and the test scripts on every change, once version control exists |
| Curriculum-data | An admin could import or hand-enter incorrect curriculum data, which every teacher then relies on | Import preview + validation + duplicate detection catch structural errors; there is no content-accuracy check (the system cannot know if a Learning Indicator's wording is *correct*, only that it's structurally valid and non-duplicated) — this remains a human review responsibility |
| AI | A teacher over-trusts an AI suggestion without adequately reviewing it before inserting | The Insert/Append/Replace/Discard flow forces an explicit action, but does not force *reading*; provenance marking (BL-008) would help make post-hoc review easier |
| AI | Sensitive pupil-identifying information typed into a reflection field could be sent to the AI provider as context | No technical control against this today (see [10-security-and-privacy.md](10-security-and-privacy.md)); mitigation is currently policy/training only — teachers should be advised not to include pupil-identifying information in free-text fields |
| Security | Rate-limited endpoints still allow up to their configured limit of automated attempts | bcrypt cost 12 is the primary brute-force defence; the rate limiter is a secondary control, not a substitute for strong passwords |
| Privacy | No account/data deletion capability | Flagged explicitly as a pre-production requirement (BL-009, BL-010) |
| Adoption/usability | A teacher clicks "My Planners" or "Curriculum" in the main nav and finds a placeholder | These are real, visible gaps — recommend building or removing the nav links before any real user sees the app (see Recommended Next Actions) |
| Operational | No monitoring means a production failure could go unnoticed | Add error/uptime monitoring before any real deployment (BL-012) |

---

## 48. Recommended Next Actions

Sequenced by dependency — earlier items unblock or de-risk later ones. This list deliberately does not add new product features beyond finishing what's already started.

1. ~~Initialize version control~~ (`git init`, initial commit) — **done 2026-09-30**: repository now has a baseline commit covering the complete Checkpoint-6-complete project state.
2. ~~Correct the root `README.md`~~ — **done** as part of producing this documentation set; it now summarises actual status and links into `docs/`.
3. ~~Decide the fate of the visible-but-unbuilt nav items~~ (`/planners`, `/curriculum`, `/classes`, `/resources`, `/assessments`) — **corrected 2026-09-30**: all five now build as real dynamic routes rather than placeholders (see the Product limitations correction above); no navigation decision remains outstanding for this item.
4. **Decide a deployment target** and implement the corresponding configuration (see [13-deployment-guide.md](13-deployment-guide.md)) — nothing further toward a real launch can proceed without this.
5. **If deploying across multiple instances:** replace the in-memory rate limiter with a shared store before launch (BL-007).
6. **Commission a privacy/legal review** before onboarding real (non-development) teachers, given the account-deletion gap and the AI provider data flow (see [10-security-and-privacy.md](10-security-and-privacy.md)).
7. **Expose `generateFullLessonDraft`** (route + UI) — the lowest-effort way to complete an already-mostly-built epic (EPIC 8).
8. **Remove or repurpose the two dead-code stub files** (`export.service.ts`, `types/index.ts`) once their intended purpose is either built or confirmed obsolete.
9. **Set up CI** to run the existing verification commands (`tsc --noEmit`, `npm run lint`, `npm run build`, and the `scripts/test-*.ts` suite against a throwaway database) on every change.
10. **Add error/uptime monitoring** as part of whatever deployment is chosen (step 4).
11. Only after the above: consider genuinely new scope (additional subjects, school accounts, analytics, etc.) from [14-development-roadmap.md](14-development-roadmap.md) Phase 9 / [15-product-backlog.md](15-product-backlog.md).

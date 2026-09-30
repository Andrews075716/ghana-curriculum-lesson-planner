# 28–29, 31–32. Accessibility, Responsive Design, Testing Strategy, Test Cases

[← Back to documentation home](README.md)

## 28. Accessibility

No formal WCAG audit tool (Lighthouse, axe) has been run against this codebase as part of building it; the assessment below is a manual code-level review.

| Area | Status |
|---|---|
| Form labels | Implemented — every form input across auth forms, the wizard, and the admin CRUD forms has an associated `<Label htmlFor>` |
| Icon-only buttons | Implemented — icon-only buttons (edit/delete/expand controls in the admin tree editor and list managers) carry `aria-label` |
| Required-field indicators | Implemented in the admin CRUD/tree forms (a visible `*`); not consistently present across every wizard field |
| Keyboard navigation | Not specifically audited; standard HTML form controls and shadcn/ui (Base UI) primitives are used throughout, which provide baseline keyboard support, but no dedicated keyboard-only walkthrough has been performed |
| Focus management | Not specifically audited (e.g. whether focus moves sensibly when a Sheet/dialog opens and closes) |
| Colour contrast | Not measured against WCAG AA/AAA thresholds |
| Semantic HTML | Headings are used hierarchically in reviewed components; a full document-wide heading-hierarchy audit has not been performed |
| Screen-reader considerations | `role="alert"` is used for error messages (inherited from the `Alert` component); `aria-live="polite"` is used on the admin import preview/result regions so new content is announced; other dynamic regions have not been audited |
| Error messages | Inline, associated with their field where the form supports it; generally readable plain text, not just colour |
| Confirmation of destructive actions | Implemented via `window.confirm()` for deletes in the admin area — functional but a plain browser dialog, not a styled, more accessible custom confirmation component |
| Mobile accessibility | Not specifically audited beyond the responsive layout behaviour described below |

**Implemented:** labelled forms, `aria-label` on icon buttons, `role="alert"` error surfacing, confirm-before-destructive-delete.
**Outstanding:** a full WCAG contrast/keyboard/screen-reader pass (recommended: run Lighthouse and axe-core against the running app, and a manual keyboard-only walkthrough of the wizard and admin area, before production launch).

## 29. Responsive Design

| Breakpoint | Expected behaviour |
|---|---|
| Desktop | Full sidebar navigation, multi-column dashboard stat cards, table-based lists (e.g. Recent Planners, admin CRUD lists) |
| Tablet | Not a distinctly designed breakpoint beyond Tailwind's default responsive utilities; layouts generally reflow correctly at intermediate widths since they're built with standard `sm:`/`lg:` utility breakpoints |
| Mobile | Sidebar collapses to a mobile nav drawer (`MobileNav.tsx`); the dashboard's Recent Planners table becomes stacked cards (`sm:hidden` / desktop-table toggle); admin CRUD tables rely on horizontal scroll (`overflow-x-auto`) rather than a dedicated stacked-card layout on narrow viewports — functional but not the most polished mobile pattern |

**Navigation adaptation:** implemented (drawer on mobile, fixed sidebar on desktop).
**Planner-editor adaptation:** the wizard's form fields and list editors use standard responsive Tailwind classes; no dedicated mobile-specific redesign of the wizard exists beyond that. Print/PDF output is intentionally desktop/print-oriented (A4 layout) and is not meant to be a responsive mobile view.

---

## 31. Testing Strategy

There is no unit-test framework (no Jest/Vitest) configured in this repository. All automated testing is via 11 standalone TypeScript scripts under `scripts/` (run with `tsx`), which exercise the application end-to-end against a live development server and a real (seeded) PostgreSQL database. This is deliberately an integration/end-to-end strategy, not an isolated-unit strategy — every layer (route → service → repository → database) is exercised together on every test run.

| Test category | Coverage | How |
|---|---|---|
| Unit tests | Not implemented as a separate category | — |
| Integration tests | Implemented | Every `scripts/test-*.ts` file is effectively an integration test — real HTTP requests (except `test-ai-architecture.ts`, which calls service functions directly in-process) against a real database |
| Database tests | Implemented (implicitly) | Curriculum hierarchy integrity, cascading delete-block behaviour, and idempotent upsert behaviour are all exercised through `test-curriculum-admin-crud.ts` and `test-curriculum-import.ts` |
| API tests | Implemented | Every route family has at least one dedicated test script |
| Authentication tests | Implemented | `test-auth.ts` |
| Authorization tests | Implemented | Ownership isolation in `test-auth.ts`; admin-role isolation in `test-curriculum-admin-crud.ts` and `test-ai-wizard-actions.ts` |
| Component tests | Not implemented (no component-level test runner is configured) | — |
| End-to-end (browser) tests | Partially implemented | No automated browser test suite (e.g. Playwright/Cypress) exists in the repository; manual browser verification (via an interactive browser tool) was used during development but is not a repeatable, checked-in test |
| Accessibility tests | Not implemented | No automated accessibility test (axe, Lighthouse CI) is configured |
| Responsive tests | Not implemented | No automated viewport/responsive test is configured; verified manually during development |
| AI validation tests | Implemented | `test-ai-architecture.ts` (schema/guardrail correctness with no live model call) and `test-ai-wizard-actions.ts` (route behaviour, including safe failure when AI is disabled) |
| Security tests | Implemented (targeted) | Cross-teacher ownership isolation, admin-role rejection for teacher/unauthenticated callers — both directly asserted, not just implied |
| Print/PDF tests | Implemented | `test-planner-print.ts`, `test-long-planner-pdf.ts` |

### Running the tests

```bash
npm run dev                          # in one terminal — tests run against a live server
npx tsx scripts/test-auth.ts         # in another terminal, one file at a time
npx tsx scripts/test-curriculum-api.ts
# ...and so on for each scripts/test-*.ts file
```

Each script prints `N passed, M failed` and exits non-zero on any failure; each cleans up the data it creates at the end of its own run. Running the full suite twice within a few minutes can trip the login rate limiter on the shared demo accounts — this is expected behaviour, not a bug (see [10-security-and-privacy.md](10-security-and-privacy.md)).

### Test inventory

| Script | Mechanism | What it verifies |
|---|---|---|
| `test-auth.ts` | HTTP | Registration, duplicate-email rejection, session-gated reads, unauthenticated rejection, logout, login (wrong password / unknown email / correct), forgot/reset password (reads the link from the dev-server log), single-use reset token, and cross-teacher planner ownership isolation |
| `test-planner-wizard-api.ts` | HTTP | Draft creation, PATCH for every wizard step, GET round-trip, replace-all semantics for list fields/themes/differentiation, publish, rejecting edits to a published planner, rejecting an incomplete publish, 404 for another teacher's draft |
| `test-main-lesson-editor.ts` | HTTP | Duplicate activity rows allowed, publish rejected without a Closure row, reordering via replace-all, publish succeeding once Closure + an assessment exist |
| `test-planner-print.ts` | HTTP | Print page renders real content for a published planner; app chrome carries `print:hidden` rather than being entirely absent |
| `test-ai-architecture.ts` | Direct function calls (no server) | Curriculum context resolves real text; unknown indicator rejected; every `generate*` fails safely with `AIUnavailableError` under `AI_PROVIDER=none`; output schemas reject anything shaped like a curriculum edit; `generateLessonActivities` vs `generateClosure` stage exclusivity; `generateFullLessonDraft` requires a Closure row |
| `test-ai-wizard-actions.ts` | HTTP | All 8 wizard-exposed AI actions fail safely; unknown action rejected; missing curriculum alignment rejected; unauthenticated caller rejected with 403 |
| `test-reflection.ts` | HTTP | Empty-state GET, full save/round-trip, unknown-field rejection (`.strict()`), reflection never touches the plan itself, reflectable-lessons discovery scoping, reflection-context id handling (valid and bogus) never leaks or crashes |
| `test-curriculum-api.ts` | HTTP | Full teacher-facing cascade against real seeded data, path hydration, validation/not-found/empty-result branches, session-gated vs deliberately-public routes |
| `test-curriculum-admin-crud.ts` | HTTP | Full CRUD for all 8 curriculum entities, validation errors, duplicate conflicts, delete-blocked-while-children-exist, 404s, and 403 rejection of teacher/unauthenticated callers across all 14 admin operations |
| `test-curriculum-import.ts` | HTTP | Valid JSON/CSV import + commit, idempotent re-import, update-via-re-import, hierarchy validation errors, in-file and against-database conflict detection |
| `test-long-planner-pdf.ts` | HTTP | A deliberately long, fully-populated planner exports correctly across multiple PDF pages with correct page breaks and repeated table headers |

As of the most recent verified run in this repository's development history, all 11 scripts passed (300+ total assertions). Re-running them is the responsibility of whoever next changes the affected code — there is no CI configured to run them automatically (see [13-deployment-guide.md](13-deployment-guide.md)).

---

## 32. Test Cases

Representative test cases, focused per the documentation brief on curriculum hierarchy, planner saving, ownership, activity ordering, duration calculations, DoK assessment, AI validation, and AI curriculum guardrails. Each corresponds to real, currently-passing assertions in the scripts above (see the Traceability Matrix, [16-traceability-matrix.md](16-traceability-matrix.md), for the exact script/assertion mapping).

| Test ID | Requirement | Precondition | Steps | Expected Result | Priority |
|---|---|---|---|---|---|
| TC-001 | FR-054 (ownership) | Two teacher accounts exist (A and B); A owns a planner | B, authenticated, requests A's planner by id | B receives `404 Not Found`, not `403` and not the planner's data | Must |
| TC-002 | FR-054 (ownership) | Same as TC-001 | B, authenticated, attempts to PATCH A's planner | Request is rejected (`404`); A's planner is unchanged | Must |
| TC-003 | FR-035 (curriculum authorization) | A `TEACHER` account is signed in | The teacher calls `POST /api/admin/curriculum/subjects` | `403 Forbidden`; no subject is created | Must |
| TC-004 | FR-035 (curriculum authorization) | No session cookie present | Any `/api/admin/curriculum/*` route is called | `403 Forbidden` | Must |
| TC-005 | §10 (curriculum hierarchy) | An admin has created a Strand with two Sub-Strands | Admin attempts to delete the Strand | `409 Conflict` — delete is refused; both Sub-Strands remain | Must |
| TC-006 | §10 (curriculum hierarchy) | A `LearningIndicator` is referenced by an existing (draft or published) planner | Admin attempts to delete that indicator | `409 Conflict` naming the number of referencing planners; delete refused | Must |
| TC-007 | FR-034 (curriculum import) | A CSV import file has two rows for the same Strand code with different names | Admin submits the file to the preview endpoint | Preview returns an error-severity issue describing the conflict; `canCommit: false` | Must |
| TC-008 | FR-034 (curriculum import) | A previously-committed import exists | The identical file is imported again | Preview classifies every node as `unchanged`; committing creates zero new rows | Should |
| TC-009 | FR-052 (autosave / planner saving) | A teacher is on Step 3 of a new draft | Teacher types into the Essential Questions field and waits | ~1.5 seconds after the last keystroke, a PATCH request saves the field automatically; the UI shows a "Saved" indicator | Must |
| TC-010 | FR-053 (publish completeness) | A draft has curriculum alignment and duration set, but no lesson activities | Teacher attempts to publish | `400 Validation Error` naming the missing Closure activity / assessment; planner remains `DRAFT` | Must |
| TC-011 | FR-068 (activity ordering) | A planner has 3 lesson activities in a specific order | Teacher reorders them in the UI and the change autosaves | GET the planner back; activities are returned in the new order (replace-all semantics — no stale rows from the old order remain) | Should |
| TC-012 | Duration calculation | A planner has `durationMinutes = 45` | An AI suggestion is requested for lesson activities | The AI prompt is built including "45-minute lesson"; suggested activity durations are proportioned to leave room for Closure (generated separately) | Should |
| TC-013 | FR-069 (DoK assessment) | Teacher adds an assessment item | Teacher selects DoK Level 3 and saves | The item persists with `dokLevel: LEVEL_3`; publish validation counts it toward "at least one assessment" | Must |
| TC-014 | FR-092 (AI output validation) | `AI_PROVIDER=none` (the default, no key configured) | Teacher clicks Generate on any AI Assist panel | `503 AI_UNAVAILABLE` with a message naming the reason ("not configured"); nothing is written to the field | Must |
| TC-015 | FR-092 (AI output validation) | A hypothetical/mocked provider response is missing a required field | `ai.service.ts`'s `validateOrThrow` runs against it | `AIInvalidOutputError` is thrown; the malformed response never reaches the caller | Must |
| TC-016 | FR-093 (AI curriculum guardrail) | Any AI action is requested | The AI response schema is inspected | The schema has no field capable of holding a curriculum id, Strand name, or Content Standard text — structurally impossible to alter curriculum data through this path | Must |
| TC-017 | FR-091 (AI review gate) | A wizard field (e.g. Pedagogical Strategies) already has teacher-typed content | Teacher generates an AI suggestion and clicks Insert | An Append/Replace/Cancel choice is shown; the field is not modified until one is chosen | Must |
| TC-018 | AI reflection-context guardrail | Teacher supplies a `reflectionSourceLessonId` for a lesson that does not exist (or belongs to another teacher) | AI generation is requested with that id | The request still fails only with the ordinary `AI_UNAVAILABLE`/validation error — no distinct error reveals whether that lesson id exists, and no data leaks across teachers | Should |
| TC-019 | FR-001 (registration) | No account exists for `new@example.edu.gh` | Visitor registers with a weak password (e.g. `abc`) | `400 Validation Error` describing the password complexity rule; no account is created | Must |
| TC-020 | FR-002 (login, no enumeration) | An account exists for `known@example.edu.gh` | Two separate login attempts are made: one with a wrong password for `known@example.edu.gh`, one with `unknown@example.edu.gh` | Both attempts return the exact same status code and message | Must |
| TC-021 | FR-006 (rate limiting) | The per-account login limit (20 requests / 5 minutes) has just been reached for one email | One more login attempt is made for that email | `429 Rate Limited` with a `Retry-After` header; the account itself is not locked (a later attempt after the window succeeds) | Should |
| TC-022 | FR-100/101 (print/PDF) | A published planner has 20+ lesson activities and 10 assessment items | Teacher exports to PDF | The PDF spans multiple pages; table headers repeat on later pages; no row is split awkwardly across a page break | Should |
| TC-023 | §21 (validation, empty results vs not found) | A Strand exists with zero Sub-Strands | Teacher's client requests Sub-Strands for that Strand | `200` with an empty array — not `404` | Should |
| TC-024 | §21 (validation, not found) | No Strand exists with the given id | Client requests Sub-Strands for that id | `404 Not Found` | Should |

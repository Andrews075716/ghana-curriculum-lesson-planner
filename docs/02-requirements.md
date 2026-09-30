# 6–7. Requirements

[← Back to documentation home](README.md)

MoSCoW priority: **Must** (required for the product to function), **Should** (important, not blocking), **Could** (nice to have), **Won't/Not Yet** (explicitly deferred).

Implementation Status uses: **IMPLEMENTED**, **PARTIALLY IMPLEMENTED**, **PLANNED**, **NOT IMPLEMENTED** — determined by direct inspection of the repository, not by assumption.

---

## 6. Functional Requirements

### Authentication

| ID | Name | Description | Actor | Priority | Acceptance Criteria | Status |
|---|---|---|---|---|---|---|
| FR-001 | Teacher registration | A visitor can create a teacher account with name, email, password, school, and optional subjects/classes/region/Teacher ID. | Visitor | Must | POST `/api/auth/register` creates a `User` (role `TEACHER`) + `TeacherProfile`; duplicate email is rejected with 409; a session cookie is set on success. | IMPLEMENTED |
| FR-002 | Login | A registered user can sign in with email and password. | Teacher, Admin | Must | POST `/api/auth/login` returns an identical error for "wrong password" and "unknown email" (no account enumeration); success sets an httpOnly session cookie. | IMPLEMENTED |
| FR-003 | Logout | A signed-in user can end their session. | Teacher, Admin | Must | POST `/api/auth/logout` clears the session cookie; subsequent authenticated calls return 403. | IMPLEMENTED |
| FR-004 | Forgot / reset password | A user who forgot their password can request a reset link and set a new password. | Teacher, Admin | Must | POST `/api/auth/forgot-password` always returns the same response regardless of whether the email exists; the reset token is single-use, hashed at rest, and expires after 1 hour. | IMPLEMENTED |
| FR-005 | Session management | The app keeps a user signed in across requests until logout or expiry. | Teacher, Admin | Must | Session is a signed JWT in an httpOnly, `sameSite=lax` cookie, 7-day expiry, verified on every request that needs identity. | IMPLEMENTED |
| FR-006 | Rate limiting on auth endpoints | Login, registration, and forgot-password are throttled against automated abuse. | System | Should | Per-IP and per-account in-memory rate limits on all three endpoints; exceeding returns 429 with `Retry-After`. | IMPLEMENTED (process-local only — see [10-security-and-privacy.md](10-security-and-privacy.md)) |

### Teacher profile

| ID | Name | Description | Actor | Priority | Acceptance Criteria | Status |
|---|---|---|---|---|---|---|
| FR-010 | View own profile | A teacher can view their profile details. | Teacher | Must | GET `/api/profile` returns name, email, school, region, Teacher ID, subjects, classes for the signed-in teacher only. | IMPLEMENTED |
| FR-011 | Edit own profile | A teacher can update their profile. | Teacher | Must | PATCH `/api/profile` validates and persists changes; subject/class lists are validated against real curriculum rows. | IMPLEMENTED |

### Dashboard

| ID | Name | Description | Actor | Priority | Acceptance Criteria | Status |
|---|---|---|---|---|---|---|
| FR-020 | Dashboard summary statistics | A teacher sees counts of their total planners, planners this term, distinct classes, and distinct subjects. | Teacher | Should | `/dashboard` renders live figures from `planner.repository.ts` queries scoped to the signed-in teacher. | IMPLEMENTED |
| FR-021 | Recent planners list | A teacher sees their most recently modified planners with quick links. | Teacher | Should | Dashboard shows a table (desktop) / stacked cards (mobile) of recent planners, or an empty state if none exist. | IMPLEMENTED |
| FR-022 | Upcoming lessons list | A teacher sees lessons scheduled soon. | Teacher | Could | Dashboard shows an upcoming-lessons panel with its own empty state. | IMPLEMENTED |

### Curriculum management (administrator)

| ID | Name | Description | Actor | Priority | Acceptance Criteria | Status |
|---|---|---|---|---|---|---|
| FR-030 | Manage Subjects | Create/edit/delete Subjects. | Curriculum Admin | Must | Full CRUD at `/admin/curriculum/subjects`; delete blocked (409) while strands reference the subject. | IMPLEMENTED |
| FR-031 | Manage Class Levels | Create/edit/delete Class Levels. | Curriculum Admin | Must | Full CRUD at `/admin/curriculum/class-levels`; same delete-block pattern. | IMPLEMENTED |
| FR-032 | Manage Curriculum Versions | Create/edit/delete Curriculum Versions (Draft/Active/Archived). | Curriculum Admin | Must | Full CRUD at `/admin/curriculum/versions`. | IMPLEMENTED |
| FR-033 | Manage Strands → Learning Indicators | Create/edit/delete the full 5-level hierarchy under a chosen Subject/Class/Version. | Curriculum Admin | Must | Expandable tree editor at `/admin/curriculum/tree`; delete blocked while children exist at every level. | IMPLEMENTED |
| FR-034 | Curriculum import (CSV/JSON) | Bulk-import or update a curriculum tree from a file. | Curriculum Admin | Must | Preview (validate + diff, no writes) then explicit Commit (re-validates, single transaction); rejects commit if any error-severity issue exists. | IMPLEMENTED |
| FR-035 | Curriculum authorization | Only `CURRICULUM_ADMIN` accounts can mutate curriculum data. | System | Must | Every admin service function independently checks the caller's role; a `TEACHER` or unauthenticated caller receives 403 on every admin route (verified by automated test). | IMPLEMENTED |

### Curriculum navigation (teacher-facing)

| ID | Name | Description | Actor | Priority | Acceptance Criteria | Status |
|---|---|---|---|---|---|---|
| FR-040 | Cascading curriculum selector | While creating a planner, a teacher selects Subject → Class → Strand → Sub-Strand → Content Standard → Learning Outcome → Learning Indicator, each level filtered by the previous. | Teacher | Must | Wizard Step 2 renders five dependent selects; each is disabled until its parent is chosen. | IMPLEMENTED (within the planner wizard) |
| FR-041 | Standalone curriculum browser | A teacher can browse the curriculum independently of creating a planner. | Teacher | Should | `/curriculum` and `/curriculum/[subjectId]/[formId]` exist as routes. | NOT IMPLEMENTED (placeholder page only) |

### Planner creation, editing, and management

| ID | Name | Description | Actor | Priority | Acceptance Criteria | Status |
|---|---|---|---|---|---|---|
| FR-050 | Create a planner draft | A teacher starts a new lesson planner. | Teacher | Must | POST `/api/planners` creates a `LessonPlanner` (status `DRAFT`) with an auto-created first `Lesson`. | IMPLEMENTED |
| FR-051 | Edit a planner draft | A teacher edits any wizard step of an unpublished planner. | Teacher | Must | `/planners/new?draftId=...` loads the existing draft; PATCH `/api/planners/[id]` updates it. | IMPLEMENTED |
| FR-052 | Autosave | Changes save automatically without an explicit "Save" click while editing. | Teacher | Must | `useAutosave` debounces 1.5s after the last change and PATCHes the draft; a status indicator shows Saving/Saved. | IMPLEMENTED |
| FR-053 | Publish a planner | A teacher finalises a complete planner. | Teacher | Must | POST `/api/planners/[id]/publish` enforces a strict completeness schema (curriculum alignment, duration, at least one lesson activity including a Closure row, at least one assessment) and sets status `PUBLISHED`. Editing a published planner's core fields is rejected. | IMPLEMENTED |
| FR-054 | Planner ownership enforcement | A teacher can only read/write their own planners. | System | Must | Every planner query is scoped by `teacherId`; a request for another teacher's planner returns 404 (not 403), so existence itself is never revealed. | IMPLEMENTED |
| FR-055 | "My Planners" list / search | A teacher can list and search all their planners. | Teacher | Should | `/planners` renders a searchable list. | NOT IMPLEMENTED (placeholder page only) |
| FR-056 | Planner detail view | A teacher can view a single planner outside the wizard/print view. | Teacher | Could | `/planners/[plannerId]` renders a summary. | NOT IMPLEMENTED (placeholder page only) |
| FR-057 | Planner duplication | A teacher can copy an existing planner as a starting point for a new one. | Teacher | Could | — | NOT IMPLEMENTED |
| FR-058 | Planner deletion | A teacher can delete a planner. | Teacher | Should | — | NOT IMPLEMENTED (no delete endpoint or UI exists for `LessonPlanner`) |

### Lesson planning content (wizard steps 3–6)

| ID | Name | Description | Actor | Priority | Acceptance Criteria | Status |
|---|---|---|---|---|---|---|
| FR-060 | Essential Questions | Add/edit a list of essential questions. | Teacher | Must | Tag-list input, Step 3; AI-assisted. | IMPLEMENTED |
| FR-061 | Cross-Cutting Themes | Select themes and provide a required explanation of how each is incorporated. | Teacher | Must | Multi-select + per-theme explanation textarea, Step 3; a theme without an explanation blocks step progression. | IMPLEMENTED |
| FR-062 | Pedagogical Strategies | Add/edit a list of pedagogical strategies. | Teacher | Must | Tag-list input, Step 3; AI-assisted. | IMPLEMENTED |
| FR-063 | Teaching & Learning Resources | Add/edit a list of resources. | Teacher | Must | Tag-list input, Step 3; AI-assisted. | IMPLEMENTED |
| FR-064 | Keywords | Add/edit a list of keywords. | Teacher | Should | Tag-list input, Step 3; no AI assistance. | IMPLEMENTED |
| FR-065 | Differentiation plan (7 fields) | Plan differentiation across 7 independent dimensions (never one free-text note). | Teacher | Must | Step 4, one field per dimension; AI-assisted, with Append merging under existing text rather than overwriting. | IMPLEMENTED |
| FR-066 | Learning Tasks | Add/edit a list of learning tasks. | Teacher | Must | Tag-list input, Step 4; no AI assistance. | IMPLEMENTED |
| FR-067 | Pedagogical Exemplars | Add/edit a list of pedagogical exemplars. | Teacher | Must | Tag-list input, Step 4; AI-assisted. | IMPLEMENTED |
| FR-068 | Main Lesson activities (Teacher/Learner Activity) | Build a staged (Starter/Introductory/Activity/Assessment/Closure) sequence of activities, each with teacher activity, learner activity, and duration. | Teacher | Must | Step 5 list editor; AI-assisted for the main flow and separately for Closure. | IMPLEMENTED |
| FR-069 | Assessment (DoK-leveled) | Add assessment items, each tagged with a Depth of Knowledge level 1–4. | Teacher | Must | Step 6 list editor; AI-assisted. | IMPLEMENTED |
| FR-070 | Lesson Closure | Add a closure activity. | Teacher | Must | Implemented as a `CLOSURE`-stage row within the same Step 5 activity list, not a separate form. | IMPLEMENTED |
| FR-071 | Step review before publish | A teacher can review a read-only summary of every step before publishing. | Teacher | Should | Step 7 renders a grouped, read-only summary of all prior steps. | IMPLEMENTED |

### Reflection

| ID | Name | Description | Actor | Priority | Acceptance Criteria | Status |
|---|---|---|---|---|---|---|
| FR-080 | Post-lesson reflection | A teacher records reflection notes for a specific lesson after teaching it. | Teacher | Must | GET/PATCH `/api/planners/[id]/lessons/[lessonId]/reflection`; 7 fields, each optional, autosaved. | IMPLEMENTED |
| FR-081 | Reuse a previous reflection as AI context | A teacher can opt to include an earlier lesson's reflection as background for AI suggestions on a new lesson. | Teacher | Could | GET `/api/planners/[id]/reflectable-lessons` lists candidate lessons (same subject+class, same teacher, has reflection content); selecting one folds its text into the AI prompt context only. | IMPLEMENTED |

### AI assistance

| ID | Name | Description | Actor | Priority | Acceptance Criteria | Status |
|---|---|---|---|---|---|---|
| FR-090 | Generate section-level suggestions | A teacher can request an AI-generated suggestion for 8 specific planning sections. | Teacher | Should | POST `/api/planners/[id]/ai/[action]` for `essential-questions`, `pedagogical-strategies`, `teaching-learning-resources`, `differentiation`, `pedagogical-exemplars`, `lesson-activities`, `assessments`, `closure`. | IMPLEMENTED (requires `AI_PROVIDER=anthropic` and a valid API key to actually generate; otherwise fails safely with a clear "unavailable" message) |
| FR-091 | Review before applying (Insert/Append/Replace/Discard) | AI output never overwrites teacher content silently. | Teacher | Must | Suggestion is held in local UI state; teacher must click Insert; if the field already has content, Append/Replace/Cancel is offered explicitly. | IMPLEMENTED |
| FR-092 | AI output schema validation | Every AI response is validated before it can reach the wizard. | System | Must | Response is validated twice — once inside the Anthropic provider, once independently in `ai.service.ts` — against a `.strict()` Zod schema; malformed output is rejected, never partially trusted. | IMPLEMENTED |
| FR-093 | AI curriculum guardrail | AI cannot alter or invent curriculum data. | System | Must | The system prompt instructs the model to treat curriculum context as fixed; output schemas contain no curriculum-id fields, so a provider response structurally cannot carry a curriculum edit. | IMPLEMENTED |
| FR-094 | Generate a full lesson draft in one call | A teacher can request one coherent draft covering essential questions, strategies, differentiation, lesson activities, and assessment together. | Teacher | Could | `generateFullLessonDraft` exists in the AI provider interface, the Anthropic provider, and `ai.service.ts`, with a dedicated output schema. | PARTIALLY IMPLEMENTED — implemented at every backend layer but **not exposed** by the `/api/planners/[id]/ai/[action]` route's action map or by any UI component; currently unreachable by a teacher. |

### Export & printing

| ID | Name | Description | Actor | Priority | Acceptance Criteria | Status |
|---|---|---|---|---|---|---|
| FR-100 | Print a planner | A teacher can print a planner via the browser's native print dialog. | Teacher | Must | `/planners/[plannerId]/print` renders a print-styled document; app chrome is hidden in print media. | IMPLEMENTED |
| FR-101 | Export a planner as PDF | A teacher can download a planner as a PDF file. | Teacher | Must | GET `/api/planners/[id]/pdf` server-renders the print page with headless Chrome (Puppeteer) and returns a PDF; multi-page content handled with correct page breaks and repeated table headers. | IMPLEMENTED |

### Administration (system-level)

| ID | Name | Description | Actor | Priority | Acceptance Criteria | Status |
|---|---|---|---|---|---|---|
| FR-110 | Server-side authorization on every route | UI hiding is never the only access control. | System | Must | Confirmed by direct code inspection: every teacher-scoped route calls `getCurrentTeacherId()`; every admin-mutating service function calls `requireAdminSession()` independently of the route. | IMPLEMENTED |
| FR-111 | Audit trail for curriculum edits | Track who changed a curriculum record and when. | Curriculum Admin | Won't/Not Yet | No `createdBy`/`updatedBy` fields exist on curriculum tables. | NOT IMPLEMENTED |

---

## 7. Non-Functional Requirements

| ID | Category | Requirement | Status |
|---|---|---|---|
| NFR-001 | Performance | Curriculum cascade lookups (Subject→...→Indicator) return in well under 1 second against the seeded dataset; no explicit performance budget is defined or measured in the codebase. | PARTIALLY IMPLEMENTED (fast in practice for current data volume; no load testing exists) |
| NFR-002 | Security — authentication | Passwords are hashed with bcrypt (cost factor 12); sessions are signed JWTs in httpOnly cookies; timing-safe comparison prevents user enumeration on login. | IMPLEMENTED |
| NFR-003 | Security — authorization | Every teacher- or admin-scoped operation is re-checked server-side, not only hidden in the UI. | IMPLEMENTED |
| NFR-004 | Security — rate limiting | Login, registration, forgot-password, and AI-generation endpoints are rate-limited. | IMPLEMENTED (in-memory, single-instance only — see [10-security-and-privacy.md](10-security-and-privacy.md) for the scaling caveat) |
| NFR-005 | Security — secrets | The Anthropic API key and session-signing secret are read only server-side (`server-only` guard) and never sent to the browser or logged. | IMPLEMENTED |
| NFR-006 | Privacy | No formal privacy policy, data-retention policy, or data-subject deletion workflow exists in the codebase. | NOT IMPLEMENTED — see [10-security-and-privacy.md](10-security-and-privacy.md) |
| NFR-007 | Accessibility | Form inputs are labelled, icon-only buttons carry `aria-label`, and destructive actions are confirmed; a full WCAG audit (contrast ratios, screen-reader pass, Lighthouse/axe run) has not been performed. | PARTIALLY IMPLEMENTED — see [11-testing-strategy.md](11-testing-strategy.md) |
| NFR-008 | Reliability | The automated test suite (11 scripts, 300+ assertions) passes against a live dev server as of the last verified run in this repository's history. No production uptime data exists (not deployed). | PARTIALLY IMPLEMENTED |
| NFR-009 | Maintainability | Code is organised into clear layers (routes → services → repositories → Prisma), with TypeScript strict typing and Zod validation at every input boundary. ESLint and `tsc --noEmit` both pass cleanly as of the last verified check. | IMPLEMENTED |
| NFR-010 | Scalability | The application runs as a single Next.js process; the in-memory rate limiter and (dev-only) embedded Postgres are both single-instance constructs. No horizontal-scaling configuration exists. | NOT IMPLEMENTED (single-instance only; documented, not built) |
| NFR-011 | Availability | No uptime target, health check endpoint, or hosting configuration exists. | NOT IMPLEMENTED |
| NFR-012 | Usability | Multi-step wizard with autosave, inline validation, and an unsaved-changes warning before navigating away. | IMPLEMENTED |
| NFR-013 | Responsive design | Layout adapts with Tailwind breakpoints (e.g. dashboard tables become stacked cards on mobile); no dedicated mobile app or offline mode. | PARTIALLY IMPLEMENTED — see [11-testing-strategy.md](11-testing-strategy.md) |
| NFR-014 | Browser compatibility | Built on standard Next.js/React 19 + modern CSS; no explicit browser support matrix or polyfill strategy is documented in the repository. | To be confirmed |
| NFR-015 | Data integrity | Curriculum hierarchy uses foreign keys with `Restrict`/`Cascade` rules chosen per relationship (see [07-database-design.md](07-database-design.md)); unique constraints on curriculum codes prevent duplicates at the database level. | IMPLEMENTED |
| NFR-016 | Backup / recovery | No automated backup process exists in the codebase or configuration. | NOT IMPLEMENTED — see [13-deployment-guide.md](13-deployment-guide.md) for proposed strategy |
| NFR-017 | Logging | Server-side errors are logged via `console.error`; there is no structured logging, log aggregation, or retention policy. | PARTIALLY IMPLEMENTED |
| NFR-018 | Monitoring | No application performance monitoring, uptime monitoring, or alerting is configured. | NOT IMPLEMENTED |
| NFR-019 | AI reliability | Every AI provider error (timeout, rate limit, auth failure, malformed output) is mapped to a specific, user-readable error rather than crashing or hanging; the app functions fully with AI disabled (`AI_PROVIDER=none`, the default). | IMPLEMENTED |

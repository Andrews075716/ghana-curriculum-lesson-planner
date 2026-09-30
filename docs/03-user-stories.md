# 8–9. User Stories and Product Epics

[← Back to documentation home](README.md)

## 9. Product Epics

| Epic | Name | Summary | Status |
|---|---|---|---|
| EPIC 1 | Authentication | Registration, login, logout, password reset, session management. | IMPLEMENTED |
| EPIC 2 | Teacher Dashboard | Summary statistics, recent planners, upcoming lessons. | IMPLEMENTED |
| EPIC 3 | Curriculum Management | Admin CRUD over the full curriculum hierarchy plus CSV/JSON import. | IMPLEMENTED |
| EPIC 4 | Lesson Planner | The 7-step wizard: basic info, curriculum alignment, planning, differentiation, main lesson, assessment, review, publish. | IMPLEMENTED |
| EPIC 5 | Teaching & Learning Activities | Essential questions, cross-cutting themes, pedagogical strategies, resources, learning tasks, pedagogical exemplars, keywords, main lesson activities. | IMPLEMENTED |
| EPIC 6 | Assessment | DoK-leveled assessment items. | IMPLEMENTED |
| EPIC 7 | Differentiation | The 7-field differentiation plan. | IMPLEMENTED |
| EPIC 8 | AI Assistance | Section-level AI suggestion generation with mandatory review before insertion. | IMPLEMENTED (section-level); full-draft generation PARTIALLY IMPLEMENTED (backend only) |
| EPIC 9 | Export & Printing | Browser print and server-rendered PDF export. | IMPLEMENTED |
| EPIC 10 | Administration | Curriculum administration UI and server-side authorization. | IMPLEMENTED |
| EPIC 11 | Planner Lifecycle Management | List, search, view, duplicate, and delete existing planners. | NOT IMPLEMENTED (only create/edit/publish exist) |
| EPIC 12 | Curriculum Browsing (teacher-facing) | A standalone curriculum browser independent of planner creation. | NOT IMPLEMENTED (placeholder pages) |

---

## 8. User Stories

Each story includes acceptance criteria for its epic's core functionality. IDs are assigned sequentially within each epic's number range for traceability (see [16-traceability-matrix.md](16-traceability-matrix.md)).

### EPIC 1 — Authentication

**US-001** — As a teacher, I want to register an account with my school and teaching details, so that I can start creating curriculum-aligned lesson planners.
*Acceptance criteria:* Registration requires name, email, password (min. 8 characters, at least one letter/number/special character), password confirmation, and school name; region, Teacher ID, subjects, and classes are optional. A duplicate email is rejected with a clear message. Status: **IMPLEMENTED**.

**US-002** — As a teacher, I want to log in with my email and password, so that I can access my planners.
*Acceptance criteria:* Correct credentials sign me in and redirect to the dashboard; incorrect credentials show one generic error that does not reveal whether the email exists. Status: **IMPLEMENTED**.

**US-003** — As a teacher, I want to reset my password if I forget it, so that I am not permanently locked out.
*Acceptance criteria:* Requesting a reset always shows the same confirmation message; the emailed (or, in development, console-logged) link works once and expires after an hour. Status: **IMPLEMENTED**.

**US-004** — As a teacher, I want to be signed out after clicking "Sign out", so that someone else using my device cannot see my planners.
*Acceptance criteria:* Signing out clears my session immediately; any further API call without a valid session is rejected. Status: **IMPLEMENTED**.

### EPIC 2 — Teacher Dashboard

**US-010** — As a teacher, I want to see how many planners I've created and how many are for the current term, so that I have a quick sense of my progress.
*Acceptance criteria:* Dashboard shows real counts computed from my own planners only. Status: **IMPLEMENTED**.

**US-011** — As a teacher, I want to jump back into a recently edited planner, so that I don't have to search for it.
*Acceptance criteria:* A "Recent Planners" panel lists my most recently modified planners with a link to continue editing, previewing, or reflecting; shows an empty-state message with a "Create Planner" call to action if I have none yet. Status: **IMPLEMENTED**.

### EPIC 3 — Curriculum Management

**US-020** — As a curriculum administrator, I want to add a new Subject, so that teachers can align planners to it.
*Acceptance criteria:* A Subject requires a unique code and name; duplicates are rejected with a clear conflict message. Status: **IMPLEMENTED**.

**US-021** — As a curriculum administrator, I want to build out the Strand → Sub-Strand → Content Standard → Learning Outcome → Learning Indicator hierarchy for a Subject/Class/Version, so that teachers have something to align their planners to.
*Acceptance criteria:* An expandable tree editor lets me add/edit/delete at every level; I cannot delete a node that still has children — I must delete children first. Status: **IMPLEMENTED**.

**US-022** — As a curriculum administrator, I want to bulk-import curriculum data from a CSV or JSON file, so that I don't have to enter hundreds of rows by hand.
*Acceptance criteria:* Uploading a file shows a preview (what will be created/updated/left unchanged, plus any validation errors) before anything is written; committing an import with unresolved errors is refused; re-importing identical data creates nothing new (idempotent). Status: **IMPLEMENTED**.

**US-023** — As a teacher, I must never be able to modify curriculum data, so that the curriculum an administrator maintains stays trustworthy for every teacher.
*Acceptance criteria:* Every `/api/admin/curriculum/*` request from a teacher account (or an unauthenticated caller) is rejected with `403 Forbidden`, verified by an automated test that checks all 14 admin operations. Status: **IMPLEMENTED**.

### EPIC 4 — Lesson Planner

**US-030** — As a teacher, I want to start a new lesson planner, so that I can begin drafting a lesson.
*Acceptance criteria:* Clicking "Create Planner" creates a draft immediately and takes me into Step 1 of the wizard. Status: **IMPLEMENTED**.

**US-031** — As a teacher, I want my work to save automatically as I type, so that I never lose progress.
*Acceptance criteria:* Changes save roughly 1.5 seconds after I stop typing, with a visible Saving/Saved indicator; leaving with unsaved changes prompts a confirmation. Status: **IMPLEMENTED**.

**US-032** — As a teacher, I want to select my exact position in the curriculum (Strand through Learning Indicator), so that my plan is properly aligned.
*Acceptance criteria:* Each selector is disabled and shows a "select X first" hint until its parent is chosen; the options shown are always the real, current curriculum data. Status: **IMPLEMENTED**.

**US-033** — As a teacher, I want to review everything before publishing, so that I can catch mistakes.
*Acceptance criteria:* Step 7 shows a complete, read-only, grouped summary of every prior step. Status: **IMPLEMENTED**.

**US-034** — As a teacher, I want publishing to be blocked if my plan is incomplete, so that I don't submit a half-finished plan.
*Acceptance criteria:* Publish requires curriculum alignment, duration, at least one lesson activity including a Closure-stage row, and at least one assessment; a specific message names what's missing. Status: **IMPLEMENTED**.

**US-035** — As a teacher, I want to find and reopen any of my past planners from a list, so that I can review or continue editing them.
*Acceptance criteria:* A searchable "My Planners" list exists. Status: **NOT IMPLEMENTED** (only a placeholder page exists at `/planners`).

**US-036** — As a teacher, I want to duplicate an existing planner as a starting point for a similar lesson, so that I don't start from a blank wizard every time.
*Acceptance criteria:* — Status: **NOT IMPLEMENTED**.

### EPIC 5 — Teaching & Learning Activities

**US-040** — As a teacher, I want to list essential questions for the lesson, so that I have a clear anchor for discussion.
*Acceptance criteria:* Free-text tag list, any number of entries, no field is mandatory to proceed. Status: **IMPLEMENTED**.

**US-041** — As a teacher, I want to select cross-cutting themes and explain how each will be incorporated, so that this isn't just a checkbox.
*Acceptance criteria:* Each selected theme requires its own explanation text before I can move to the next step. Status: **IMPLEMENTED**.

**US-042** — As a teacher, I want to build a staged main lesson (Starter, Introductory, Activity, Assessment, Closure) with teacher and learner activity described separately for each stage, so that the flow of the lesson is explicit.
*Acceptance criteria:* Each activity row has a stage, label, duration, teacher activity text, and learner activity text; rows can be reordered and removed. Status: **IMPLEMENTED**.

### EPIC 6 — Assessment

**US-050** — As a teacher, I want to tag each assessment item with a Depth of Knowledge level, so that I'm deliberately varying rigor.
*Acceptance criteria:* Each assessment item requires a DoK level (1–4) and a description. Status: **IMPLEMENTED**.

### EPIC 7 — Differentiation

**US-060** — As a teacher, I want to plan differentiation across distinct dimensions (grouping, scaffolding, extension, resource adaptation, task differentiation, peer support, other notes), so that I don't collapse differentiation into one vague note.
*Acceptance criteria:* Seven independent text fields, each optional. Status: **IMPLEMENTED**.

### EPIC 8 — AI Assistance

**US-070** — As a teacher, I want to ask AI to suggest content for a specific section (e.g. essential questions), so that I have a starting point instead of a blank field.
*Acceptance criteria:* Clicking "Generate" shows a preview I have not yet committed to; I can Regenerate or Discard freely. Status: **IMPLEMENTED**.

**US-071** — As a teacher, I want AI suggestions to never silently overwrite what I've already written, so that I don't lose my own work.
*Acceptance criteria:* If the field already has content, clicking Insert asks me to choose Append, Replace, or Cancel; nothing is written until I choose. Status: **IMPLEMENTED**.

**US-072** — As a teacher, I want AI to never invent or change the official curriculum text, so that I can trust the curriculum references in my plan.
*Acceptance criteria:* AI output schemas contain no curriculum-id or curriculum-text fields; the system prompt explicitly forbids altering curriculum data. Status: **IMPLEMENTED**.

**US-073** — As a teacher, I want to optionally use my reflection from an earlier, related lesson as background for a new AI suggestion, so that AI can help me avoid repeating something that didn't work.
*Acceptance criteria:* I can pick a previous lesson (same subject/class, my own, with reflection content) from a list; its reflection text is included as context, clearly separated from the current curriculum context. Status: **IMPLEMENTED**.

**US-074** — As a teacher, I want to generate one coherent full-lesson draft in a single action, so that I don't have to click Generate eight separate times.
*Acceptance criteria:* — Status: **PARTIALLY IMPLEMENTED** (the backend function `generateFullLessonDraft` exists end-to-end, but no API route or UI button currently calls it).

### EPIC 9 — Export & Printing

**US-080** — As a teacher, I want to print my planner in the standard Learning Planner layout, so that I have a paper copy that matches the expected format.
*Acceptance criteria:* The print view renders a clean, chrome-free document via the browser's native print dialog. Status: **IMPLEMENTED**.

**US-081** — As a teacher, I want to download my planner as a PDF, so that I can share or archive it digitally.
*Acceptance criteria:* An "Export to PDF" button downloads a correctly paginated PDF, even for a long, multi-page plan. Status: **IMPLEMENTED**.

### EPIC 10 — Administration

**US-090** — As a curriculum administrator, I want every administrative action I take to be denied to non-admin accounts even if they call the API directly, so that "hide the button" is never the only protection.
*Acceptance criteria:* Verified by automated test: every admin mutation checks the caller's role in the service layer itself, independent of the route or the UI. Status: **IMPLEMENTED**.

### EPIC 11 — Planner Lifecycle Management (mostly not implemented)

**US-100** — As a teacher, I want to delete a planner I no longer need, so that my planner list stays relevant.
*Acceptance criteria:* — Status: **NOT IMPLEMENTED**.

### EPIC 12 — Curriculum Browsing

**US-110** — As a teacher, I want to browse the curriculum independently of building a planner, so that I can plan ahead across a whole term.
*Acceptance criteria:* — Status: **NOT IMPLEMENTED** (`/curriculum` and `/curriculum/[subjectId]/[formId]` are placeholder pages).

# 1–5. Product Overview

[← Back to documentation home](README.md)

---

## 1. Executive Summary

**Project name:** Ghana Curriculum Lesson Planner

**Problem being solved:** Teachers in Ghana are expected to produce lesson planners that follow a specific national format (the "Learning Planner") and align precisely to the official Ghana Education Service (GES) curriculum hierarchy — Subject, Class/Form, Strand, Sub-Strand, Content Standard, Learning Outcome, and Learning Indicator. Producing this document by hand, in a word processor, for every lesson is repetitive and makes it easy for the curriculum references to drift from the official wording.

**Target users:** Individual classroom teachers in Ghana (the primary user), and a curriculum administrator role responsible for keeping the underlying curriculum data accurate.

**Proposed solution:** A web application in which the official curriculum hierarchy is stored as structured data, never as free text a teacher retypes. A teacher selects their curriculum position from a guided cascade (Subject → Class → Strand → Sub-Strand → Content Standard → Learning Outcome → Learning Indicator) and builds the rest of the lesson planner — essential questions, pedagogical strategies, resources, differentiation, the main lesson, assessment, closure, and post-lesson reflection — in a structured, auto-saving, multi-step wizard. An optional AI assistant can suggest content for the planning sections (not the curriculum references themselves), which the teacher must explicitly review and insert.

**Key benefits:**
- Curriculum references (Strand/Sub-Strand/Content Standard/Learning Outcome/Learning Indicator text) always come from one authoritative database, never retyped or guessed.
- Structured data entry replaces free-form documents, so every planner has the same shape.
- Draft content saves automatically as the teacher works.
- Optional AI assistance for planning content, with a strict rule that AI never invents or edits curriculum standards.
- A print/PDF export that reproduces the planner in the national Learning Planner format.

**Current development status:** This is a working pre-production application. The authentication system, the full curriculum administration area, the seven-step planner-creation wizard, curriculum-aligned AI assistance for planning content, post-lesson reflection, and print/PDF export are implemented and covered by an automated test suite. Several navigation items visible in the app (My Planners list, planner detail view, Curriculum Browser, Classes, Resources, Assessments, and the public marketing home page) are placeholder pages only — see [17-project-status.md](17-project-status.md) for the authoritative implemented/partial/planned breakdown. The application has not been deployed to a production environment and is not yet under version control (see [12-installation-guide.md](12-installation-guide.md)).

**Long-term product vision:** A curriculum-first planning tool that eventually covers every GES subject and class level (only Computing, Form 1 is seeded today), supports school-level accounts and shared resources, and gives administrators visibility into curriculum coverage across a school. These are documented as future possibilities in [14-development-roadmap.md](14-development-roadmap.md) — none are implemented.

---

## 2. Problem Statement

This section describes the lesson-planning problem the application is designed for. It is deliberately scoped to what the application's own design addresses — it does not make claims about the state of lesson planning in Ghanaian schools generally, since no such research is part of this repository.

- **Curriculum alignment.** A lesson planner is expected to reference the exact Strand, Sub-Strand, Content Standard, Learning Outcome, and Learning Indicator wording defined by the curriculum. Typing this by hand for every lesson risks transcription drift from the source document.
- **Time required to prepare lesson plans.** The national Learning Planner format (see the reference document in `docs/lesson plan.docx`) has many required sections per lesson — essential questions, pedagogical strategies, resources, a seven-part differentiation plan, learning tasks, pedagogical exemplars, keywords, a staged main lesson (teacher/learner activity per stage), DoK-leveled assessment, closure, and reflection. Producing all of this from scratch for every lesson is time-consuming.
- **Consistency of lesson planning.** Without a shared structure, two teachers' planners for the same content standard can end up organised very differently, making them harder to review or compare.
- **Curriculum navigation.** Finding the right Strand → Sub-Strand → Content Standard → Learning Outcome → Learning Indicator combination in a source document is slower than a guided, filtered selection.
- **Differentiation.** The reference format asks for differentiation across several distinct dimensions (grouping, scaffolding, extension, resource adaptation, task differentiation, peer support), which is easy to collapse into a single vague note if the tool doesn't structure it.
- **Assessment.** Assessment items are expected to be tagged with a Depth of Knowledge (DoK) level, which requires the teacher to think about assessment rigor explicitly.
- **Teacher reflection.** The format asks teachers to reflect after each lesson (what went well, what didn't, what needs reteaching), which is only useful if it is easy to complete and easy to refer back to when planning a related lesson later.
- **Resource planning.** Teaching and learning resources are listed per lesson; without a system, this list is retyped from memory each time.
- **Potential role of AI.** Generative AI can plausibly help a teacher draft planning content faster (essential questions, strategy suggestions, activity ideas), but this is only trustworthy if the AI never touches the official curriculum data and every suggestion is reviewed by the teacher before it becomes part of the plan.

---

## 3. Project Objectives

### Primary objective
Let a teacher produce a curriculum-aligned Ghana Learning Planner through a structured, guided workflow rather than a blank document, with the official curriculum hierarchy sourced from application data.

### Secondary objectives
- Provide a curriculum administration area so curriculum data can be maintained (created, corrected, versioned, bulk-imported) without editing application code.
- Provide optional AI assistance for planning content, strictly separated from curriculum data.
- Provide a faithful print/PDF export of the completed planner.
- Support post-lesson reflection linked to the lesson it describes.

### Technical objectives
- Enforce curriculum integrity at the database level (foreign keys, unique codes, delete restrictions) so application bugs cannot corrupt the curriculum hierarchy or silently orphan a lesson planner's curriculum reference.
- Enforce authorisation server-side for every request — a teacher can only read or write their own planners, and only a `CURRICULUM_ADMIN` account can mutate curriculum data — independent of what the UI shows or hides.
- Validate every AI response against a strict schema before it can reach a teacher's planner, and never let AI content overwrite existing teacher-written content without an explicit choice.

### Educational objectives
- Preserve the exact terminology and structure of the Ghana Learning Planner reference document (Essential Questions, Cross-Cutting Themes, Pedagogical Strategies, Teaching & Learning Resources, Key Notes on Differentiation, Learning Tasks, Pedagogical Exemplars, Keywords, Main Lesson, Teacher Activity, Learner Activity, Assessment/DoK, Lesson Closure, Reflection & Remarks).
- Keep curriculum references (Strand through Learning Indicator) as the anchor for every other part of the plan, so a teacher always starts from "what must be taught" before deciding "how".

### MVP vs long-term
The MVP, as implemented, covers a single subject/class (Computing, Form 1) end to end: authentication, curriculum administration, planner creation through publish, reflection, and PDF export. Long-term objectives — additional subjects, school accounts, analytics, collaboration — are documented as future scope only; see [14-development-roadmap.md](14-development-roadmap.md).

---

## 4. Scope

### IN SCOPE (implemented or actively part of the current build)
- Teacher registration, login, logout, forgot/reset password, session management.
- Teacher profile (name, school, subjects, classes, region, Teacher ID).
- A `CURRICULUM_ADMIN` role with full CRUD over the curriculum hierarchy (Subject, Class Level, Curriculum Version, Strand, Sub-Strand, Content Standard, Learning Outcome, Learning Indicator).
- Curriculum import from structured CSV or JSON, with hierarchy validation, duplicate detection, and a preview step before anything is written.
- A seven-step lesson planner creation wizard with autosave.
- AI-assisted suggestions for eight planning sections (essential questions, pedagogical strategies, teaching & learning resources, differentiation, pedagogical exemplars, lesson activities, assessments, closure), gated behind an explicit "Insert" action.
- Post-lesson reflection, one per lesson, optionally offered as background context to a later AI-assisted lesson.
- Print and PDF export of a planner in the Learning Planner layout.
- A dashboard showing a teacher's own planner statistics, recent planners, and upcoming lessons.

### OUT OF SCOPE (explicitly not being built as part of this application's current direction)
- A public-facing marketing or informational website (the `/` route exists only as a placeholder).
- Collaborative/shared editing of a single planner by multiple teachers.
- School-level accounts or multi-school administration.
- A native mobile application.
- Offline editing.
- Integration with external school information systems.

### FUTURE SCOPE (documented as possibilities, not implemented — see [14-development-roadmap.md](14-development-roadmap.md))
- Additional Ghanaian curriculum subjects and class levels beyond Computing/Form 1.
- A teacher-facing curriculum browser, a "My Planners" list/search view, and a planner detail view (all currently placeholder pages — see [17-project-status.md](17-project-status.md)).
- Curriculum coverage and assessment analytics.
- Planner templates and a shared resource library.
- Teacher collaboration features.

This section exists specifically to prevent scope creep: anything not listed as IN SCOPE above should be treated as a proposal, not a commitment, until it is actually implemented.

---

## 5. Stakeholders and User Roles

The application implements exactly two account roles, defined by the `Role` enum in the database schema (`TEACHER`, `CURRICULUM_ADMIN`). No other role (e.g. a separate "School Administrator") exists in the codebase; it is listed below only where the requested documentation structure asks for it, and is explicitly marked as not implemented.

### Teacher — IMPLEMENTED
**Responsibilities:** Maintain their own profile; create, edit, and publish their own lesson planners; complete post-lesson reflections; export/print their planners.

**Permissions:** Full read/write access to their own planners, lessons, and reflections only (enforced server-side by scoping every query to the authenticated teacher's id). Read access to curriculum reference data (subjects, class levels, strands, and all levels beneath them) needed to build a planner. No access to curriculum administration routes (`/admin/*`, `/api/admin/*`) — every one of these independently rejects a `TEACHER` account with `403 Forbidden`.

**Major workflows:** Register/log in, complete profile, create a planner via the wizard, use AI assistance, publish, reflect after teaching, print/export.

### Curriculum Administrator (`CURRICULUM_ADMIN`) — IMPLEMENTED
**Responsibilities:** Maintain the official curriculum hierarchy: create/correct Subjects, Class Levels, Curriculum Versions, Strands, Sub-Strands, Content Standards, Learning Outcomes, and Learning Indicators; import curriculum data in bulk from CSV/JSON with validation and preview.

**Permissions:** Full CRUD over curriculum master data via the `/admin/curriculum/*` pages and `/api/admin/curriculum/*` routes. No special access to teachers' planners — a `CURRICULUM_ADMIN` account is not a "super teacher" and the codebase does not implement any planner-level admin override. An admin account is not required to also have a `TeacherProfile` (the `User.role` field alone determines access).

**Major workflows:** Sign in, manage each curriculum entity through the admin UI, or bulk-import/update a curriculum tree via the Import page (preview before commit).

### School Administrator — NOT IMPLEMENTED
Not present in the codebase in any form (no role, no route, no schema field beyond a teacher's own optional `School` reference for their profile). Any future "school administrator" role able to see or manage multiple teachers' data at a school level is a **future roadmap item only** — see [14-development-roadmap.md](14-development-roadmap.md).

### Future Curriculum Administrator capabilities — PARTIALLY IMPLEMENTED
The current `CURRICULUM_ADMIN` role covers full CRUD and import for the curriculum hierarchy. It does not include: audit history of who changed what curriculum record and when (no `createdBy`/`updatedBy` fields exist on curriculum tables), or managing multiple curriculum versions' lifecycle beyond a status field (`DRAFT`/`ACTIVE`/`ARCHIVED`) that exists in the schema but has no enforced meaning elsewhere in the application (e.g. nothing currently filters planners to only allow selecting an `ACTIVE` version). These are documented as gaps, not as a separate role.

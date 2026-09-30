# 42. Product Backlog

[← Back to documentation home](README.md)

Prioritised by dependency order and risk, not calendar time — no dates are assigned, per documentation policy. "Status" reflects the current repository state only.

| ID | Feature | Epic | Priority | Dependencies | Status |
|---|---|---|---|---|---|
| BL-001 | Expose `generateFullLessonDraft` via the API route and a wizard UI control | EPIC 8 — AI Assistance | Must | None — every backend layer already exists | Not started (backend complete, route/UI missing) |
| BL-002 | Build the "My Planners" list/search page | EPIC 11 — Planner Lifecycle | Must | None — `GET` list capability would need a small new repository query; ownership pattern already established | Not started |
| BL-003 | Build the planner detail view (`/planners/[plannerId]`) | EPIC 11 — Planner Lifecycle | Should | BL-002 (naturally linked from the list) | Not started |
| BL-004 | Planner duplication | EPIC 11 — Planner Lifecycle | Should | BL-002 | Not started |
| BL-005 | Planner deletion | EPIC 11 — Planner Lifecycle | Should | BL-002 | Not started |
| BL-006 | Build the teacher-facing curriculum browser (`/curriculum`, `/curriculum/[subjectId]/[formId]`) | EPIC 12 — Curriculum Browsing | Should | None — teacher-facing curriculum read API already exists | Not started |
| BL-007 | Replace the in-memory rate limiter with a shared store (Redis/Upstash) | Non-functional / Security | Must (before multi-instance deployment) | A chosen hosting/deployment target | Not started |
| BL-008 | AI-content provenance marking (flag AI-inserted-then-accepted content) | EPIC 8 — AI Assistance | Should | Schema change (a new field) + UI treatment | Not started |
| BL-009 | Account/data deletion capability | Non-functional / Privacy | Should | Decide the correct cascade behaviour for a teacher's planners on deletion | Not started |
| BL-010 | Formal privacy/legal review and policy | Non-functional / Privacy | Must (before handling real users at scale) | None (a process, not code) | Not started |
| BL-011 | Deployment configuration (hosting choice, CI/CD, environment provisioning) | Non-functional / Operations | Must (before any real deployment) | A chosen hosting platform | Not started |
| BL-012 | Error/uptime monitoring integration | Non-functional / Operations | Should | BL-011 | Not started |
| BL-013 | Curriculum-version-aware selection (make `DRAFT`/`ACTIVE`/`ARCHIVED` actually restrict what a teacher can select) | EPIC 3 — Curriculum Management | Could | None | Not started |
| BL-014 | Automated accessibility testing (axe/Lighthouse CI) | Non-functional / Quality | Should | None | Not started |
| BL-015 | Automated browser (E2E) test suite | Non-functional / Quality | Could | A chosen tool (e.g. Playwright) | Not started |
| BL-016 | Additional curriculum subjects/class levels | EPIC 3 — Curriculum Management | Could | A source document per subject | Not started |
| BL-017 | Update the root `README.md` to reflect current implementation status | Documentation | Should | None | **Done** — corrected as part of producing this documentation set |
| BL-018 | Batch the curriculum-import DB-diff queries (currently one query per node) | Non-functional / Performance | Could | Only relevant if import file sizes grow significantly | Not started |
| BL-019 | Audit trail (`createdBy`/`updatedBy`) on curriculum records | EPIC 10 — Administration | Could | Schema change | Not started |
| BL-020 | School-level accounts | Future scope | Won't (not yet) | Significant scope addition — see [14-development-roadmap.md](14-development-roadmap.md) | Not started |
| BL-021 | Collaborative planning | Future scope | Won't (not yet) | BL-020 likely a prerequisite | Not started |
| BL-022 | Curriculum coverage / assessment analytics | Future scope | Won't (not yet) | Real usage data to be useful | Not started |

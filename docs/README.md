# Ghana Curriculum Lesson Planner — Documentation

A curriculum-first, AI-assisted lesson planning platform for teachers in Ghana. This documentation set is derived directly from the application's source code, database schema, tests, and the Ghanaian sample lesson plan reference (`docs/lesson plan.docx`) — it does not describe planned functionality as if it already existed. See [17-project-status.md](17-project-status.md) for an honest, evidence-based summary of what is built, partially built, and not yet started.

> **Note on the root `README.md`:** an earlier version of the file at the repository root predated most of the current codebase and described the project as unstarted scaffolding. It has been corrected to summarise actual status and link here — this `docs/` folder remains the authoritative, detailed documentation. See [17-project-status.md](17-project-status.md#technical-debt) for the history.

## How to use this documentation

- **New to the project?** Start with [01-product-overview.md](01-product-overview.md), then [04-curriculum-architecture.md](04-curriculum-architecture.md) and [05-learning-planner-specification.md](05-learning-planner-specification.md) to understand the domain.
- **Setting up locally?** Go straight to [12-installation-guide.md](12-installation-guide.md).
- **Extending the database?** [07-database-design.md](07-database-design.md).
- **Building or changing the API?** [08-api-documentation.md](08-api-documentation.md).
- **Working on AI features?** [09-ai-architecture.md](09-ai-architecture.md) — read the Guardrails section before changing anything AI-related.
- **Security or privacy review?** [10-security-and-privacy.md](10-security-and-privacy.md).
- **Testing?** [11-testing-strategy.md](11-testing-strategy.md).
- **Deploying?** [13-deployment-guide.md](13-deployment-guide.md) — note that no deployment is currently configured; that document is a proposal.
- **Planning what's next?** [17-project-status.md](17-project-status.md) → [14-development-roadmap.md](14-development-roadmap.md) → [15-product-backlog.md](15-product-backlog.md).

## Document index

| Document | Covers |
|---|---|
| [01-product-overview.md](01-product-overview.md) | Executive summary, problem statement, objectives, scope, stakeholders and roles |
| [02-requirements.md](02-requirements.md) | Functional requirements (FR-xxx) and non-functional requirements (NFR-xxx) |
| [03-user-stories.md](03-user-stories.md) | User stories (US-xxx) grouped by product epic |
| [04-curriculum-architecture.md](04-curriculum-architecture.md) | The Subject→Learning Indicator hierarchy, curriculum integrity rules, and curriculum data management (import, validation, versioning) |
| [05-learning-planner-specification.md](05-learning-planner-specification.md) | The Ghana Learning Planner structure field-by-field, and step-by-step user workflows with flowcharts |
| [06-system-architecture.md](06-system-architecture.md) | Information architecture (route table), system architecture, technology stack, repository structure, performance |
| [07-database-design.md](07-database-design.md) | Every database model, the ER diagram, cascading behaviour, and the data dictionary |
| [08-api-documentation.md](08-api-documentation.md) | Every API endpoint, validation rules, and error handling |
| [09-ai-architecture.md](09-ai-architecture.md) | The AI pipeline, provider abstraction, guardrails, and prompt architecture |
| [10-security-and-privacy.md](10-security-and-privacy.md) | Authentication/authorization detail, a security risk table, and privacy/data-protection review |
| [11-testing-strategy.md](11-testing-strategy.md) | Accessibility, responsive design, testing strategy, and representative test cases (TC-xxx) |
| [12-installation-guide.md](12-installation-guide.md) | Local setup, environment variables, development workflow |
| [13-deployment-guide.md](13-deployment-guide.md) | Proposed deployment, logging/monitoring, and backup/disaster recovery (nothing currently configured) |
| [14-development-roadmap.md](14-development-roadmap.md) | Phased roadmap (Phase 1–9) and future-development possibilities |
| [15-product-backlog.md](15-product-backlog.md) | Prioritised backlog (BL-xxx), no calendar dates |
| [16-traceability-matrix.md](16-traceability-matrix.md) | Requirement → user story → module → database entity → API/function → test case |
| [17-project-status.md](17-project-status.md) | Known limitations, risks and mitigations, current status, and recommended next actions |
| [glossary.md](glossary.md) | Ghanaian curriculum and application terminology |

## Identifier conventions

| Prefix | Meaning | Defined in |
|---|---|---|
| `FR-xxx` | Functional requirement | [02-requirements.md](02-requirements.md) |
| `NFR-xxx` | Non-functional requirement | [02-requirements.md](02-requirements.md) |
| `US-xxx` | User story | [03-user-stories.md](03-user-stories.md) |
| `TC-xxx` | Test case | [11-testing-strategy.md](11-testing-strategy.md) |
| `BL-xxx` | Backlog item | [15-product-backlog.md](15-product-backlog.md) |

## Status legend

Used throughout this documentation set, determined by direct repository inspection rather than assumption:

- **IMPLEMENTED** — built, working, and (where applicable) covered by an automated test.
- **PARTIALLY IMPLEMENTED** — some layers exist (e.g. backend but no UI, or schema but no enforcement); the gap is stated explicitly.
- **PLANNED** — designed/discussed but no code exists yet.
- **NOT IMPLEMENTED** — no evidence of the feature in the codebase; often a placeholder page (`RouteStub`) exists at the expected route.

Where a fact could not be confirmed from the repository, this documentation says **"To be confirmed"** rather than guessing.

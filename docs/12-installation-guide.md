# 33–35. Installation Guide, Environment Variables, Development Workflow

[← Back to documentation home](README.md)

## 33. Installation Guide

### Prerequisites
- Node.js 20+ (the repository was developed against Node 24; `@types/node` targets the v20 API surface, so 20+ is the safe floor)
- npm (ships with Node)
- A PostgreSQL database — either the bundled zero-install option below, or any PostgreSQL 14+ instance you already have (local, Docker, or a hosted provider)
- Google Chrome or Chromium installed locally, if you want PDF export to work (see `PUPPETEER_EXECUTABLE_PATH` below) — not required for the rest of the app

### 1. Clone the repository
```bash
git clone <repository-url>
cd "GOLD TEach"
```
> This repository is **not currently under version control** in its working state (no `.git` directory exists in the delivered codebase). If you are starting from this exact snapshot, run `git init` yourself before this step is meaningful — see Development Workflow below.

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
```bash
cp .env.example .env
```
Then edit `.env` — at minimum, set `DATABASE_URL` and generate a `SESSION_SECRET`:
```bash
openssl rand -base64 32
```
See the full variable reference below.

### 4. Configure the database

**Option A — zero-install local PostgreSQL (recommended for local development):**
```bash
npm run db:local
```
This starts a real PostgreSQL 18 instance under `.pgdata/` (gitignored) on `localhost:5432`, with user `user` / password `password` / database `ghana_curriculum_planner` — matching the default `DATABASE_URL` in `.env.example`. Leave this running in its own terminal.

**Option B — your own PostgreSQL instance:** point `DATABASE_URL` in `.env` at it instead; skip `npm run db:local`.

### 5. Run migrations
```bash
npx prisma migrate deploy
```
(Use `npx prisma migrate dev` instead if you intend to author new migrations during development — it additionally offers to create new migration files from schema changes.)

### 6. Seed the database
```bash
npm run db:seed
```
This creates: the Computing/Form 1 curriculum tree, the 4 cross-cutting themes, a demo teacher account, and a demo admin account. **Seeded demo credentials are development fixtures only, defined in `prisma/seed-data/demo-teacher.ts` and `demo-admin.ts` in this repository — read those files directly for the current values rather than relying on any credentials reproduced elsewhere, and never reuse them for a real account.**

### 7. Start the development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

### Verifying the install
```bash
npx tsc --noEmit          # TypeScript should report zero errors
npm run lint               # ESLint should report zero issues
npm run build               # Production build should succeed
```
Then, with the dev server running, exercise the automated test scripts described in [11-testing-strategy.md](11-testing-strategy.md).

---

## 34. Environment Variables

| Variable | Purpose | Required / Optional | Example placeholder |
|---|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string used by Prisma | **Required** | `postgresql://user:password@localhost:5432/ghana_curriculum_planner?schema=public` |
| `NODE_ENV` | Runtime mode | Optional (defaults to `development`) | `development` \| `test` \| `production` |
| `SESSION_SECRET` | Signs session JWT cookies; also read by `src/proxy.ts` | **Required** | *(generate with `openssl rand -base64 32`; never commit a real value — rotating it invalidates every session)* |
| `AI_PROVIDER` | Selects the AI backend | Optional (defaults to `none`, which disables AI entirely via `NoopAIProvider`) | `none` \| `anthropic` |
| `ANTHROPIC_API_KEY` | Anthropic API key | Required only when `AI_PROVIDER=anthropic` | *(obtain from https://console.anthropic.com/ — never commit a real key)* |
| `ANTHROPIC_MODEL` | Overrides the default Claude model | Optional | *(defaults to `claude-sonnet-5` if unset)* |
| `PUPPETEER_EXECUTABLE_PATH` | Path to a Chrome/Chromium binary for PDF export | Optional (auto-detected if not set — see `src/server/pdf/find-chrome.ts`) | `/usr/bin/chromium` |
| `EMAIL_PROVIDER` | Selects the email backend for password-reset emails | Optional (defaults to `console`, which logs the email instead of sending it) | `console` *(only value currently implemented)* |

No real secret values are reproduced in this documentation. `.env.example` in the repository root holds placeholders only and is safe to commit; `.env` itself is gitignored.

---

## 35. Development Workflow

**Version control status:** the delivered codebase has no initialized `.git` repository. Before any of the practices below can apply, initialize one (`git init`) and make an initial commit. Everything in this section describes the *intended* workflow once version control exists — none of it (branch protection, CI, PR templates) is currently configured.

**Branching:** no branching convention is encoded anywhere in the repository (no `CONTRIBUTING.md`, no branch-protection config). Recommended default: trunk-based development with short-lived feature branches, until the team's own convention is established.

**Feature development:** the codebase's own layering convention should be followed for any new feature: add/extend a Zod schema in `src/lib/validation/`, a repository function in `src/server/repositories/`, a service function in `src/server/services/` (this is where authorization checks belong), a route in `src/app/api/`, and UI in `src/components/` — in that order, mirroring how every existing feature is structured.

**Testing:** there is no requirement enforced by tooling, but the established pattern in this codebase is to add a corresponding `scripts/test-*.ts` script for any new API surface, run against a live dev server, cleaning up its own data at the end (see [11-testing-strategy.md](11-testing-strategy.md)).

**Linting:**
```bash
npm run lint
```
Config: `eslint.config.mjs` (Next.js core-web-vitals + TypeScript rule sets, with unused variables/args prefixed `_` allowed).

**Type checking:**
```bash
npx tsc --noEmit
```

**Database migrations:** any schema change goes through `prisma/schema.prisma` followed by `npx prisma migrate dev --name <description>` (interactive) — on Windows, stop the dev server first if a migration fails to apply due to a locked query-engine file. Never hand-edit an already-applied migration file; add a new one.

**Commit practices:** none are enforced by tooling (no commit-lint, no pre-commit hook configuration found in the repository). Recommended: small, focused commits with a clear rationale in the message.

**Pull requests / code review:** no PR template, CODEOWNERS file, or required-reviewers configuration exists. Recommended before this becomes a team project: require at least one review before merging to the main branch, and run the verification commands above (`tsc`, `lint`, `build`, the test scripts) as required checks.

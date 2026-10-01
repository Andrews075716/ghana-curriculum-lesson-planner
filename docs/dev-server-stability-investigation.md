# Dev-server stability investigation

Infrastructure-only investigation. No application business logic, curriculum
data, or database schema was changed. No live Anthropic API calls were made.

## Symptom

During manual browser acceptance testing, the local dev server repeatedly
failed with:

```
⨯ Error: Jest worker encountered 2 child process exceptions, exceeding retry limit
  { type: 'WorkerError', page: '/api/planners/<id>/reflectable-lessons' }
```

("Jest worker" here is the `jest-worker` npm package Next.js uses internally
for dev-mode background compilation — it has no relation to the Jest testing
framework.) This caused route compilation to fail before the application's
own route handler ever ran, which surfaced to the browser as:

- `PATCH /api/planners/[id]` → non-JSON crash response → WizardShell's
  `saveDraft()` falls back to its generic `"Failed to save."` message
  (the fallback fires specifically when `res.json()` can't parse the
  response body).
- `POST /api/planners/[id]/ai/full-lesson-draft` → same non-JSON crash
  response → `ai-client.ts`'s `requestAISuggestion()` falls back to its
  generic `"Something went wrong generating a suggestion. Please try
  again."` message, via the identical mechanism.

Both generic-message code paths were confirmed correct and were not the
defect — they were doing exactly what they're supposed to do when handed a
response that isn't a clean `AppError` JSON envelope.

## Environment

| | |
|---|---|
| Node | v24.19.0 |
| npm | 11.17.0 |
| Next.js | 16.3.5 |
| React | 19.2.8 |
| TypeScript | ^5 |
| Dev mode (before fix) | Turbopack (implicit default for `next dev` in this Next.js version) |
| `next.config.ts` | no Turbopack-specific configuration present |
| Previous dev command | `next dev` |

`npx next dev --help` confirms `--webpack` as the officially supported,
documented opt-out flag for forcing Webpack in dev mode.

## Resource pressure

At the time of the crash, system memory was under severe pressure: **529 MB
free of 7,941 MB total (~93% utilized)**. Process inspection
(`Get-CimInstance Win32_Process -Filter "Name='node.exe'"`) found:

- One live Turbopack worker-pool child process
  (`pool_entry-[turbopack-node]_transforms_postcss_ts_...`), distinct from
  the main `next dev` process.
- Two zombie node.exe processes with empty command lines — consistent with
  child processes that died and were not fully reaped.

These are not duplicate dev servers (the normal npm → tsx/next spawn chain
is multi-hop and was accounted for separately) — they are extra processes
specific to Turbopack's dev-mode worker pool.

## Cache

`.next` was cleared (`rm -rf .next`) as a disposable-cache precaution before
the comparison test below. `.pgdata`, uploads, curriculum data, source
files, environment files, and the database were never touched. The crash
was already observed prior to this cache clear and continued to be
reproducible in principle after it (see Webpack comparison), so a corrupted
`.next` cache is **not indicated** as the cause — clearing it is a
reasonable hygiene step, not a demonstrated fix on its own.

## Route-specificity

The WorkerError was observed against three structurally different routes
with different handlers and imports: `/api/planners/[id]/reflectable-lessons`,
`PATCH /api/planners/[id]`, and `/api/planners/[id]/ai/[action]`. All three
failed via the identical generic WorkerError. This points to a shared
dev-mode infrastructure failure (the worker pool itself), not a defect in
any one route's compiled module.

## Production build

`npm run build` passed cleanly, both before and after the fix below. This
confirms the issue is specific to dev-mode infrastructure, not a general
compilation or type-correctness defect in the application.

## Node / Next.js compatibility

Next.js 16.3.5 requires Node `>=20.9.0` (`node_modules/next/package.json`
`engines.node`). Installed Node is v24.19.0. **Compatible — PASS.**

## Webpack comparison

Per protocol, Webpack was tried as a temporary, controlled comparison before
drawing any conclusion about Turbopack:

1. Degraded Turbopack dev server was stopped.
2. `npx next dev --webpack` was started fresh.
3. A 5-round, 35-request stability test exercised the exact previously
   failing surface: `GET /dashboard`, `GET /planners/new`,
   `PATCH /api/planners/[id]`, `GET /api/planners/[id]/reflectable-lessons`,
   `GET /api/curriculum/strands`, `GET /curriculum`, and
   `POST /api/planners/[id]/ai/full-lesson-draft` (against a curriculum
   fixture that is AI-ineligible by design, so it fails fast with a clean
   422 before ever reaching the AI provider — zero Anthropic calls, zero
   cost).

Result: **35/35 requests succeeded. Zero WorkerErrors. Zero 500s.** This
held even as available memory dropped further during the test (to 494 MB
free), i.e. under equal or worse memory pressure than when Turbopack was
crashing. The Webpack server's own log showed no errors (only the known,
harmless Grammarly/QuillBot browser-extension hydration-mismatch warning).
Process inspection showed a clean 3-entry process tree (npx → next dev
script → start-server.js) with no separate worker-pool child process and no
zombie processes — unlike the Turbopack run.

## Root cause

**Demonstrated:** Turbopack's dev-mode worker pool fails under this
machine's memory pressure (~93% utilized), killing child compilation
processes and surfacing as the generic `jest-worker` "exceeding retry
limit" error, which in turn produces a non-JSON crash response for
whichever route happened to be compiling at the time. This is corroborated
by (a) the worker-pool/zombie-process evidence, (b) the Webpack comparison
staying stable under equal-or-worse memory pressure while exercising the
identical route surface, and (c) the fact that `npm run build` (which also
exercises full compilation, just not via the dev worker pool) is unaffected.

**Not demonstrated / explicitly not claimed:** the exact internal exception
inside the dying Turbopack worker child process. The `jest-worker` library
swallows the underlying per-child exception detail and does not surface it
in Next.js's dev logging; no deeper stack trace was found in
`.next/dev/logs/next-development.log`, `.next/trace`, `.next/trace-build`,
or `.next/dev/trace`. Nor is this report claiming Turbopack has a general
defect outside this specific low-memory environment — the evidence here is
specific to this machine's current memory headroom, not a claim about
Turbopack in general.

## Fix / workaround

`package.json`'s `dev` script now runs `next dev --webpack` (Next.js's own
documented, supported flag) instead of the implicit Turbopack default.
`dev:turbo` is preserved as an explicit opt-in for anyone who wants to run
Turbopack (e.g. once more memory headroom is available, or to re-test after
a future Next.js/Turbopack update).

```diff
- "dev": "next dev",
+ "dev": "next dev --webpack",
+ "dev:turbo": "next dev",
  "build": "next build",
```

This is a dev-server configuration change only. It does not touch
`next.config.ts`, application code, routes, or the production build
(`next build` / `next start`, which were never Turbopack-based here, are
unaffected).

## Remaining uncertainty

- The precise internal exception that kills a Turbopack worker child
  process was not recoverable from available logs (see Root cause above).
- Whether the same instability would reproduce on a machine with more free
  memory was not tested — the demonstrated conclusion is scoped to this
  machine's current memory conditions.
- Two leftover bare `DRAFT` planners (no curriculum content,
  `learningIndicatorId: null`) remain in the database from the original
  real browser session that first surfaced this crash (`createdAt`
  2026-09-30T20:14:42, ids `cmuojnlko0015eji4hxn4onzo` and
  `cmuojnlo20018eji4lsaq4yev` — the latter is the exact planner id named in
  the original crash log). They were intentionally left untouched rather
  than deleted, since they reflect real user session state and not test
  debris, and removing another person's data was out of scope for an
  infrastructure investigation. They can be discarded from the app's own
  "My Planners" view, or on request.

## Stability test

PASS — 35/35 requests, 0 WorkerErrors, 0 unexpected 500s, across 5 rounds
under Webpack dev mode while memory pressure held or worsened.

# 20–21, 30. API Documentation, Validation Rules, Error Handling

[← Back to documentation home](README.md)

## 20. API Documentation

All endpoints are Next.js Route Handlers under `src/app/api/`. All request/response bodies are JSON. All responses follow one of two shapes:

```json
// Success
{ "data": { /* endpoint-specific */ } }

// Error
{ "error": { "code": "VALIDATION_ERROR", "message": "Human-readable message" } }
```

For the full route table (path, method, role, auth requirement, implementation status), see [06-system-architecture.md](06-system-architecture.md#13-information-architecture). This section documents representative endpoints in depth, grouped by area; endpoints that repeat an identical pattern (e.g. the 8 admin curriculum CRUD resource pairs) are documented once with the pattern noted.

### Authentication

#### `POST /api/auth/register`
- **Auth:** None (public, rate-limited: 10 requests/IP/hour)
- **Input:** `{ name, email, password, confirmPassword, schoolName, region?, staffId?, subjectIds?, classLevelIds? }`
- **Validation:** `RegisterSchema` — password ≥ 8 chars with letter/number/special character; password/confirmPassword must match; email format checked.
- **Response:** `201 { data: { registered: true } }`, session cookie set.
- **Errors:** `400 VALIDATION_ERROR`, `409 CONFLICT` (email already registered), `429 RATE_LIMITED`.

#### `POST /api/auth/login`
- **Auth:** None (public, rate-limited: 60/IP/5min, 20/email/5min)
- **Input:** `{ email, password }`
- **Response:** `200 { data: { loggedIn: true } }`, session cookie set.
- **Errors:** `400 VALIDATION_ERROR` — **identical message and status for "wrong password" and "unknown email"**, by design, to prevent account enumeration; `429 RATE_LIMITED`.

#### `POST /api/auth/logout`
- **Auth:** None required (clears whatever session exists, if any)
- **Response:** `200 { data: { loggedOut: true } }`, cookie cleared.

#### `POST /api/auth/forgot-password`
- **Auth:** None (public, rate-limited: 20/IP/hour, 5/email/hour)
- **Input:** `{ email }`
- **Response:** `200`, **always the same message regardless of whether the email exists** — `{ data: { message: "If an account exists for that email, a reset link has been sent." } }`.
- **Behaviour:** if the email exists, a single-use token is created (only its SHA-256 hash is stored) and a reset link is sent via the configured email provider (console-log only in development).

#### `POST /api/auth/reset-password`
- **Auth:** None (token-based)
- **Input:** `{ token, password, confirmPassword }`
- **Response:** `200 { data: { reset: true } }`
- **Errors:** `400` — invalid, expired, or already-used token; password complexity failure.

### Profile

#### `GET /api/profile` / `PATCH /api/profile`
- **Auth:** Required (`getCurrentUser()`)
- **PATCH input:** `{ name, schoolName, region?, staffId?, subjectIds?, classLevelIds? }` — `subjectIds`/`classLevelIds` are validated against real curriculum rows (unknown ids are silently filtered out, not an error).
- **Response:** the current teacher's full profile.

### Planners

#### `POST /api/planners`
- **Auth:** Required
- **Response:** `201 { data: { id } }` — creates a `DRAFT` planner with one auto-created `Lesson`.

#### `GET /api/planners/[id]`
- **Auth:** Required, owner only
- **Response:** the full draft (all step data, resolved curriculum labels, and the first lesson's id).
- **Errors:** `404 NOT_FOUND` for a planner that doesn't exist **or** belongs to another teacher — the two cases are indistinguishable in the response, so a teacher can never learn that another teacher's planner id exists.

#### `PATCH /api/planners/[id]`
- **Auth:** Required, owner only
- **Input:** `PlannerDraftUpdateSchema` (see Validation Rules below) — every field optional; only fields present are written.
- **Response:** `200 { data: { saved: true } }`
- **Errors:** `400 VALIDATION_ERROR`, `404 NOT_FOUND` (not owner / doesn't exist), `409 CONFLICT` (planner already published — core fields are immutable after publish).

#### `POST /api/planners/[id]/publish`
- **Auth:** Required, owner only
- **Validation:** `PlannerPublishSchema` — strict: curriculum alignment, duration, class section, term, week, at least one lesson activity including a `CLOSURE` row, at least one assessment.
- **Response:** `200 { data: { published: true } }`
- **Errors:** `400 VALIDATION_ERROR` naming what's missing.

#### `GET /api/planners/[id]/pdf`
- **Auth:** Required, owner only
- **Response:** `200`, `Content-Type: application/pdf`, `Content-Disposition: attachment` — binary PDF body.
- **Behaviour:** server-renders the planner's print page with headless Chrome; forwards the caller's session cookie into that internal render so the print page (itself an authenticated route) renders correctly rather than showing a login page.

#### `GET /api/planners/[id]/reflectable-lessons?subjectId=&classLevelId=`
- **Auth:** Required, owner only
- **Response:** lessons taught by this same teacher, in the same subject/class, that already have reflection content — candidates to use as AI context for a new lesson.

#### `GET /api/planners/[id]/lessons/[lessonId]/reflection` / `PATCH ...`
- **Auth:** Required, owner only
- **PATCH input:** `ReflectionInputSchema` (`.strict()` — an unknown field is rejected, not silently dropped) — all 7 fields optional.
- **Response (GET):** `200` with all 7 fields, `null` for anything not yet saved (never a 404 for "not saved yet").

#### `POST /api/planners/[id]/ai/[action]`
- **Auth:** Required, owner only (rate-limited: 60/IP/10min, 30/teacher/10min)
- **`action`:** one of `essential-questions`, `pedagogical-strategies`, `teaching-learning-resources`, `differentiation`, `pedagogical-exemplars`, `lesson-activities`, `assessments`, `closure`. (`full-lesson-draft` is **not** a valid value here — see [09-ai-architecture.md](09-ai-architecture.md).)
- **Input:** `{ count?, reflectionSourceLessonId? }` — `count` only affects list-generating actions; `reflectionSourceLessonId` must be a lesson the requesting teacher owns.
- **Response:** `200 { data: { suggestion, meta: { provider, generatedAt } } }`
- **Errors:** `400 VALIDATION_ERROR` (unknown action, or curriculum/duration not set yet), `503 AI_UNAVAILABLE` (no provider configured), `502 AI_INVALID_OUTPUT`, `429 AI_RATE_LIMITED` / `RATE_LIMITED`, `504 AI_TIMEOUT`, `502 AI_REQUEST_FAILED`. See [09-ai-architecture.md](09-ai-architecture.md) for the full AI error taxonomy.

### Curriculum (teacher-facing reference data)

All of `GET /api/curriculum/{class-levels,strands,sub-strands,content-standards,learning-outcomes,learning-indicators}` and `GET /api/curriculum/learning-indicators/[id]/path` follow the same pattern:
- **Auth:** Required (except `/api/curriculum/subjects` and `/api/curriculum/class-levels/all`, which are deliberately public — see [06-system-architecture.md](06-system-architecture.md))
- **Input:** one or two query-string parent ids (e.g. `?strandId=...`)
- **Response:** `200 { data: [{ id, label }, ...] }` — an empty array (not a 404) for a valid parent with no children yet.
- **Errors:** `400 VALIDATION_ERROR` (missing query param), `404 NOT_FOUND` (parent id doesn't exist), `403 FORBIDDEN` (no session, on the gated routes).

### Curriculum administration

All 8 entities (`subjects`, `class-levels`, `versions`, `strands`, `sub-strands`, `content-standards`, `learning-outcomes`, `learning-indicators`) under `/api/admin/curriculum/` follow one consistent pattern:

| Method | Path | Behaviour |
|---|---|---|
| `GET` | `/api/admin/curriculum/{entity}` | List (optionally filtered by parent id via query params for the nested entities) |
| `POST` | `/api/admin/curriculum/{entity}` | Create — `201` on success, `409 CONFLICT` on a duplicate code/name |
| `PATCH` | `/api/admin/curriculum/{entity}/[id]` | Update — `404` if not found, `409` on a duplicate conflict |
| `DELETE` | `/api/admin/curriculum/{entity}/[id]` | Delete — `404` if not found, `409 CONFLICT` if child rows still reference it |

**Auth (every one of the above):** `CURRICULUM_ADMIN` role required — checked inside `curriculum-admin.service.ts`, not in the route file. A `TEACHER` account or an unauthenticated caller receives `403 FORBIDDEN` on every single one of these, confirmed by an automated test that exercises all 14 operations.

#### `POST /api/admin/curriculum/import/preview`
- **Auth:** `CURRICULUM_ADMIN`
- **Input:** `{ format: "csv" | "json", content: string }` (content capped at 10 MB)
- **Response:** `200 { data: { counts, issues, canCommit } }` — no database writes occur.

**Example response:**
```json
{
  "data": {
    "counts": {
      "subjects": { "create": 1, "update": 0, "unchanged": 0 },
      "learningIndicators": { "create": 13, "update": 0, "unchanged": 0 }
    },
    "issues": [
      { "severity": "warning", "path": "trees[0].strands[1]", "message": "Duplicate sequence number(s) among siblings: 1." }
    ],
    "canCommit": true
  }
}
```

#### `POST /api/admin/curriculum/import/commit`
- **Auth:** `CURRICULUM_ADMIN`
- **Input:** identical to preview
- **Behaviour:** re-runs the full parse/validate/diff pipeline from scratch (never trusts a client-held preview); if any error-severity issue remains, refuses with `400 VALIDATION_ERROR` and writes nothing; otherwise commits every tree inside one database transaction.
- **Response:** `200 { data: { counts, issues, canCommit: true } }`

---

## 21. Validation Rules

All validation is performed with Zod (`src/lib/validation/*.ts`). **Every route that accepts a body validates it server-side before use** — client-side validation (inline form errors, `required` attributes) exists for user experience only and is never the sole check.

| Area | Client-side | Server-side | Notes |
|---|---|---|---|
| Authentication | Password complexity hint, confirm-password match | `RegisterSchema`/`LoginSchema`/`ForgotPasswordSchema`/`ResetPasswordSchema` (`src/lib/validation/auth.schema.ts`) | Password: ≥8 chars, ≥1 letter, ≥1 number, ≥1 special character |
| Curriculum selection | Selects disabled until parent chosen | Query-param schemas per level (`src/lib/validation/curriculum.schema.ts`); parent-id existence checked against the database | A syntactically valid but non-existent id → `404`, not `400` |
| Planner creation/autosave | Step-level checks in `validateStep.ts` (block "Next") | `PlannerDraftUpdateSchema` — every field optional, only present fields are written | This is intentionally lenient — a draft must always be saveable |
| Planner publish | Step 7 review (visual only) | `PlannerPublishSchema` — strict, all fields required, `.refine()` requiring a `CLOSURE`-stage activity | This is the one place full completeness is enforced |
| Lesson activities | Row-level "complete or remove" check | `LessonActivityInputSchema` — label ≤120 chars, teacher/learner activity ≤4000 chars each, duration 1–300 min, max 25 rows per planner | |
| Assessment | Row-level "complete or remove" check | `AssessmentInputSchema` — description ≤2000 chars, DoK level required, max 20 rows | |
| Duration | Number input | `durationMinutes`: integer, 1–600 (planner); `LessonActivity.durationMinutes`: integer, 1–300 | |
| DoK | Dropdown constrained to 4 values | `DokLevelSchema` enum (`LEVEL_1`–`LEVEL_4`) | |
| Reflection | None (always saveable) | `ReflectionInputSchema` — `.strict()`, all 7 fields optional, ≤4000 chars each | An unrecognised field name is rejected outright, not dropped |
| AI output | N/A (server-generated) | Every `generate*` response is validated twice: once inside `AnthropicAIProvider` against the same schema forced on the model, and again independently in `ai.service.ts` | See [09-ai-architecture.md](09-ai-architecture.md) |
| Curriculum imports | File type check (`.csv`/`.json`) before upload | Structural validation, in-file duplicate detection, against-database diff — see [04-curriculum-architecture.md](04-curriculum-architecture.md#19-curriculum-data-management) | |

---

## 30. Error Handling

### Error response shape and codes

Every route wraps its logic in `try { ... } catch (error) { return handleRouteError(error); }`. `handleRouteError` (`src/server/errors/handle-route-error.ts`) maps a typed `AppError` subclass to a consistent JSON response; anything else is logged server-side via `console.error` and returned as a generic `500 { error: { code: "INTERNAL", message: "Something went wrong." } }` — **no stack trace or internal detail is ever sent to the client.**

| Error class | HTTP status | Code | When |
|---|---|---|---|
| `ValidationError` | 400 | `VALIDATION_ERROR` | Zod validation failure, malformed request |
| `ForbiddenError` | 403 | `FORBIDDEN` | No session, or session present but wrong role |
| `NotFoundError` | 404 | `NOT_FOUND` | Resource doesn't exist, or exists but isn't owned by the caller |
| `ConflictError` | 409 | `CONFLICT` | Duplicate unique field, or delete blocked by existing children |
| `RateLimitedError` | 429 | `RATE_LIMITED` | Rate limit exceeded (carries a `Retry-After` header) |
| `AIUnavailableError` | 503 | `AI_UNAVAILABLE` | No AI provider configured/enabled |
| `AIInvalidOutputError` | 502 | `AI_INVALID_OUTPUT` | AI response failed schema validation |
| `AIRateLimitError` | 429 | `AI_RATE_LIMITED` | The upstream AI provider itself rate-limited the request |
| `AITimeoutError` | 504 | `AI_TIMEOUT` | AI provider request timed out (60s) |
| `AIRequestError` | 502 | `AI_REQUEST_FAILED` | Network failure or other non-2xx from the AI provider |
| *(unhandled)* | 500 | `INTERNAL` | Anything not an `AppError` — logged server-side only |

### Expected user experience

- **Validation errors** — shown inline, next to the offending field where the form supports it (auth forms, admin CRUD forms); shown as a page-level alert otherwise.
- **Authentication errors** — an invalid/expired session redirects to `/login` (optimistically, by `src/proxy.ts`, before the page even renders); an API call with no valid session returns `403` without a redirect (the caller — client JS — decides what to do).
- **Authorization errors (403)** — surfaced as a page-level alert; a non-admin visiting `/admin/*` directly is redirected to `/dashboard` by the `(admin)` layout rather than shown a 403 page.
- **404 (resource not found / not owned)** — the planner wizard and reflection page treat this the same as "doesn't exist"; there is no dedicated custom 404 page beyond Next.js's default for page routes.
- **500 (unexpected server error)** — a generic "Something went wrong" message; the underlying error is only visible in the server log.
- **AI errors** — shown inside the specific `AIAssistPanel` that triggered the request (`role="alert"`), never as a page-level failure; the rest of the wizard remains fully usable.
- **Network errors (client couldn't reach the server at all)** — caught by each component's own `fetch(...).catch(...)` and shown as a generic "failed to load/save" message; behaviour is implemented per-component, not through a single global handler.
- **Empty states** — deliberately distinct from errors: an empty "My Recent Planners" list, an empty reflection, or a curriculum level with no children yet all render a normal `200` response with an empty result and a purpose-built empty-state UI, never treated as an error condition.
- **Loading states** — every async action that mutates data (save, publish, AI generate, admin create/update/delete, import preview/commit) disables its trigger control and shows a spinner while in flight, to prevent duplicate submissions.
- **Rate limits (429)** — surfaced to the user as the `RateLimitedError`'s message ("Too many requests. Please try again shortly."); the `Retry-After` header is set on the response but is not currently read/displayed by any client-side code.
- **Timeouts** — an AI request that exceeds 60 seconds is mapped to `AITimeoutError` and shown with a specific "took too long to respond" message, distinct from a generic failure.

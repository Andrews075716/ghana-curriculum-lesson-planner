# Manual Browser Acceptance — Preparation & Checklist

[← Back to documentation home](README.md)

**No real-browser interaction tooling was available in this session** — no
screenshot capability, no browser automation. Nothing below is claimed as a
passing visual/interactive test unless it was genuinely verified another way
(HTTP requests against a live server, or reading the actual rendered
component's source). Every item requiring a real browser is marked
**MANUAL USER VERIFICATION REQUIRED**, per this task's own instructions —
not guessed at.

## What was actually done this session

1. **Started the app cleanly.** Found an existing dev server and Postgres
   instance already running; verified the dev server's health via HTTP
   before reusing it, per "avoid duplicate processes." Confirmed database
   totals unchanged (33 subjects / 1083 CS / 1157 LO / 3070 LI / 35 links).
2. **Deep-inspected `/curriculum`** (the one page Checkpoint 9 flagged as
   "not exercised") — read both its components in full
   (`CurriculumBrowserLanding.tsx`, 72 lines; `CurriculumTreeBrowser.tsx`,
   253 lines) and found it is **not a placeholder**: a real Subject/Class
   picker, an expandable Strand→Sub-Strand→Content Standard→Learning
   Outcome→Learning Indicator tree (lazy-loaded per node), and a debounced
   search box — all built from the exact same `useCurriculumOptions` hook,
   `CurriculumSelectField` component, and `/api/curriculum/*` routes
   (including `/api/curriculum/search`) already covered by 58+9=67 passing
   assertions in `test-curriculum-api.ts`. Because it has no separate query
   path, its status-visibility filtering is consistent with the
   established teacher policy **by construction**, not by a new check —
   REJECTED exclusion was already proven end-to-end against these same
   endpoints in `test-curriculum-status-policy.ts`.
3. **Ran a live HTTP smoke test** of the exact request sequence the
   `/curriculum` pages make (subject list → class levels → the page route
   itself → strands → sub-strands → content standards → learning outcomes
   → learning indicators → search-with-results → search-with-no-results →
   the landing page route) against Computing/SHS 1, a real subject.
4. **Found and diagnosed a real failure**: both `/curriculum` page routes
   initially returned HTTP 500 against a dev server instance that had been
   running across many prior turns. Investigated rather than assumed — the
   server's own log showed `ChunkLoadError` / "Uncaught Error: An
   unexpected Turbopack error occurred," the same corrupted-long-lived-dev-server
   pattern already documented repeatedly in Checkpoints 7-9. Restarted the
   dev server cleanly (clearing `.next`) and re-ran the identical smoke
   test: **both routes returned 200**, and every step in the drill-down
   returned correct, real curriculum data. **This was infrastructure
   flakiness, not a code defect — no code change was made or needed.**
5. **Confirmed the app's dialog/select primitives are `@base-ui/react`**
   (`alert-dialog.tsx` imports `AlertDialog as AlertDialogPrimitive from
   "@base-ui/react/alert-dialog"`), a maintained, accessibility-focused
   component library that handles focus-trapping, Escape-to-close, focus
   restoration, and ARIA semantics as part of its own design contract —
   real supporting evidence, not a substitute for actually exercising it
   in a browser.
6. **Zero real Anthropic API calls.** No code changes were made this
   session, so no new regression run was needed beyond the read-only
   verification above.

## Results by area

| Area | Status | Evidence |
|---|---|---|
| App starts cleanly | PASS | HTTP 200 from a live dev server + Postgres, database totals verified unchanged |
| Desktop | **MANUAL USER VERIFICATION REQUIRED** | No browser tooling |
| Tablet | **MANUAL USER VERIFICATION REQUIRED** | No browser tooling |
| Mobile | **MANUAL USER VERIFICATION REQUIRED** | No browser tooling |
| Keyboard accessibility | **MANUAL USER VERIFICATION REQUIRED** | Base UI primitives provide strong-by-default behavior (see above); not independently exercised |
| Form accessibility | **MANUAL USER VERIFICATION REQUIRED** (code-level `Label`/`aria-invalid`/`aria-describedby`/`role="alert"` confirmed present in Checkpoint 7's source reading — not re-verified live) | Static code reading only |
| Wizard step-awareness | **MANUAL USER VERIFICATION REQUIRED** | `WizardStepper.tsx` exists and is used; not visually inspected |
| Dialogs/modals | **MANUAL USER VERIFICATION REQUIRED** (built on `@base-ui/react/alert-dialog`, which is accessibility-focused by design) | Source confirms the library; behavior not exercised |
| AI Assist UX (browser) | **FAIL → diagnosed twice, see the two defect reports below** | First report: "AI Suggestion is not working" on Computing/Form-1 — root-caused to correct, by-design eligibility rejection. Second report (this update): "Something went wrong generating a suggestion" on an AI-eligible Agriculture curriculum path — root-caused to a severely degraded dev server process, not a code defect; see "Save + AI defect report (Agriculture curriculum)" below. **AWAITING MANUAL RETEST** against the now-restarted, healthy server. |
| SAVE (browser) | **FAIL → diagnosed, see "Save + AI defect report (Agriculture curriculum)" below** | Reported: "Failed to save." on the same Agriculture curriculum path. Root-caused to the same degraded dev server. **AWAITING MANUAL RETEST.** |
| Save/Reopen/Edit (browser) | **MANUAL USER VERIFICATION REQUIRED** — proven at the database/service level (`test-checkpoint9-e2e.ts` §5 and the new Agriculture-specific test, by exact id, not label) but not clicked through in a browser | same |
| `/curriculum` browser — data/API correctness | **PASS** | Live HTTP smoke test: 33 subjects, real class levels, full strand→indicator drill-down, search with results and with no results, all 200s with correct data |
| `/curriculum` browser — actual rendering/interaction | **MANUAL USER VERIFICATION REQUIRED** | Tree-expand clicks, debounce timing, and visual layout were not observed |
| `/curriculum` status-visibility consistency | **PASS** (by construction) | Identical `/api/curriculum/*` endpoints as everywhere else; no separate query path exists to diverge |

## Manual checklist for you

Run `npm run db:local` (if not already running) and `npm run dev`, then open
`http://localhost:3000` in a real browser. Log in as the existing demo
teacher account (credentials are in `prisma/seed-data/` — not reproduced
here per "do not expose credentials in documentation"). For each item,
report **PASS**, **FAIL** (with a description/screenshot), or **N/A**.

### Desktop (~1280px+ width)

- [ ] Login page loads, form submits, redirects to `/dashboard`
- [ ] Dashboard: sidebar/nav visible, "Create Planner" entry point present, stats readable
- [ ] Create Planner → Step 1 Basic Information: Subject/Class dropdowns work, term/week/duration fields accept input, Next advances
- [ ] Step 2 Curriculum Alignment: Strand→Sub-Strand→Content Standard→Learning Outcome→Learning Indicator cascade works; pick a subject with long Content Standard text (try **Mathematics** or **Chemistry**) and confirm it wraps rather than overflows its dropdown/card
- [ ] Step 2: the "Generate Full Lesson Draft" AI Assist control appears once a Learning Indicator is selected
- [ ] Step 3 Planning: Essential Questions/Cross-Cutting Themes/Pedagogical Strategies/Resources/Keywords all editable; each has an "AI Assist" panel
- [ ] Step 4 Differentiation & Pedagogy: all 7 differentiation fields editable
- [ ] Step 5 Main Lesson: activity editor (add/remove/reorder/duplicate), duration total vs. planned indicator, AI Assist for both main activities and Closure
- [ ] Step 6 Assessment: DoK-level picker, description field, AI Assist
- [ ] Step 7 Review & Save: summary reflects everything entered; Save Planner works
- [ ] `/planners` (My Planners): the saved planner appears in the list
- [ ] Reopen the planner: every field (curriculum selection, teacher content, AI-accepted content) is restored
- [ ] Edit: change the Subject in Step 1/2 and confirm Class/Strand/Sub-Strand/Content Standard/Learning Outcome/Learning Indicator all clear
- [ ] Save again, reopen again: the edited state persists
- [ ] `/curriculum`: subject/class picker works, "Browse Curriculum" navigates to the tree view, clicking a Strand expands it, clicking a Sub-Strand/Content Standard/Learning Outcome expands further to Learning Indicators, the search box returns results as you type

### Tablet (~768px width)

Repeat the same checklist above at this width. Pay particular attention to:
- [ ] Sidebar/navigation doesn't overlap content
- [ ] Curriculum dropdowns remain usable
- [ ] Long Content Standard/Learning Outcome/Learning Indicator text doesn't overflow its container
- [ ] AI Assist panel buttons remain tappable and legible
- [ ] Activity editor and assessment UI remain usable
- [ ] `/curriculum` tree browser remains usable

### Mobile (~390px, and ~360px if practical)

- [ ] Navigation remains reachable (hamburger/drawer or equivalent — no essential nav item is permanently off-screen)
- [ ] Every wizard step's form fields stack vertically and remain usable
- [ ] Dropdowns/selects open and are operable via touch
- [ ] Long curriculum text wraps (does not force horizontal scroll)
- [ ] AI Assist Generate/Insert/Regenerate/Discard buttons remain tappable
- [ ] Activity/assessment editors remain readable and editable
- [ ] Review & Save is usable; Save works
- [ ] My Planners list doesn't require horizontal scroll to be usable (or degrades to stacked cards)
- [ ] A saved planner can be reopened and edited at this width
- [ ] `/curriculum` tree browser is usable (tree indentation doesn't push content off-screen)

### Keyboard-only pass (any viewport)

- [ ] Tab through the login form, submit with Enter
- [ ] Tab through the entire wizard on one step — every control (dropdowns, text inputs, buttons, AI Assist buttons) is reachable in a logical order
- [ ] Every focused control has a **visible** focus indicator
- [ ] Open a curriculum Select dropdown with keyboard (Enter/Space), navigate options with arrow keys, select with Enter, close with Escape
- [ ] Trigger a delete/confirm dialog (e.g. deleting a Resource or Class) via keyboard, confirm it can be operated (Tab between Cancel/Confirm, Escape to dismiss) and that focus returns to a sensible place after closing
- [ ] Reach and activate an AI Assist "Generate" button via keyboard, then Tab to Insert/Regenerate/Discard once a suggestion appears

### Forms

- [ ] Every input/select has a visible label (not just a placeholder)
- [ ] Required fields are visually distinguishable
- [ ] Submitting Step 1/2 with a missing required field shows an error message next to that specific field
- [ ] Error text is in plain language (not a raw code or stack trace)
- [ ] A disabled field (e.g. Class/Form before a Subject is chosen) is visually distinguishable from an enabled one and its disabled reason is stated (e.g. "Select a subject first.")

### Wizard

- [ ] The current step is visually indicated in the stepper
- [ ] Completed/visited steps are distinguishable from not-yet-visited ones
- [ ] Clicking an earlier step in the stepper navigates back without losing data
- [ ] Trying to advance past a step with a validation failure shows a clear message and does not silently fail

### Dialogs (confirm-delete, etc.)

- [ ] Opens via both mouse and keyboard
- [ ] Escape closes it
- [ ] Focus is trapped inside while open (Tab doesn't escape to the page behind it)
- [ ] Focus returns to a sensible element after closing
- [ ] Content fits within the viewport at all three widths (no dialog taller/wider than the screen)

### AI Assist UX

Use a curriculum selection you know is AI-eligible (any subject/class other
than the original Computing/Form-1 seed data — e.g. Mathematics SHS 1).
`AI_PROVIDER` should be left as configured in your `.env`/`.env.local` — if
it's `none`, you'll see the "AI Assist isn't available right now" message,
which is itself a valid thing to verify:
- [ ] Clicking "Generate" shows a loading state
- [ ] On success, a preview renders that is visually distinguishable from official curriculum text (different container styling — confirm it doesn't look like a Content Standard/Learning Outcome field)
- [ ] Insert, when the field already has content, prompts Append/Replace/Cancel
- [ ] Regenerate replaces the preview with a new suggestion
- [ ] Discard clears the preview with nothing applied
- [ ] If AI is unavailable (`AI_PROVIDER=none`), the error message is plain-language, not a stack trace or code

### AI-ineligible curriculum UX

This requires a curriculum record that's teacher-visible but AI-ineligible
(e.g. a `NEEDS_REVIEW`+`PENDING` record) — the original Computing/Form-1
seed data (`COMP-F1-...` codes) is exactly this case (confirmed
AI-ineligible in Checkpoint 8/9's automated tests):
- [ ] Select Computing → SHS 1 → any Strand/Sub-Strand/Content Standard/Learning Outcome/Learning Indicator in Step 2 (should all be selectable normally)
- [ ] In Step 3+, click any AI Assist "Generate" button
- [ ] Confirm the error message explains AI isn't available for this selection, in plain language — no mention of `extractionStatus`, database ids, or provider internals

### Save / Reopen / Edit — one full browser journey

- [ ] Create a new planner, select a real curriculum path (e.g. Mathematics), fill Basic Information
- [ ] Use AI Assist (if `AI_PROVIDER` is configured) to generate and accept at least one suggestion
- [ ] Fill remaining steps with a mix of teacher-typed and (if available) AI-accepted content
- [ ] Save
- [ ] Go to My Planners, confirm it's listed
- [ ] Reopen it, confirm every field is restored exactly
- [ ] Edit one field, save again
- [ ] Reopen once more, confirm the edit persisted
- [ ] If this created a planner you don't want to keep, delete it afterward (via the UI, or ask for it to be cleaned up)

## Report back

For each checklist section: **PASS**, **FAIL** (describe what happened,
ideally with a screenshot), or **N/A**. A screenshot is most useful for
anything in the Desktop/Tablet/Mobile/Dialogs sections — a visual defect is
hard to describe precisely in words.

## AI Suggestion browser defect report

**Reported:** "AI Suggestion is not working" in the real browser, overriding
the earlier automated-test-based assumption that AI Assist was ready.

**Investigation (0 live Anthropic calls):**

1. Checked `.env.local` without exposing its value: `AI_PROVIDER=anthropic`,
   `ANTHROPIC_API_KEY` configured (non-empty), no `ANTHROPIC_MODEL`
   override (uses the code default, `claude-sonnet-5`).
2. Restarted the dev server cleanly to guarantee these env values were
   actually loaded (Next.js does not hot-reload `.env.local` changes into
   an already-running process — this matters in case the key had been
   rotated since the server was last started).
3. Reproduced the **exact** request sequence the browser's AI Assist button
   sends (`ai-client.ts`'s `requestAISuggestion`) via HTTP against the
   freshly-restarted server: login → `POST /api/planners` → `PATCH` the
   planner with curriculum + duration → `POST /api/planners/:id/ai/essential-questions`.
4. Asked which subject had been used in the browser: **Computing (Form 1 /
   SHS 1)** — confirmed to match the reproduction exactly.

**Result:** `HTTP 422`, `AI_CURRICULUM_INELIGIBLE`, with a complete, safe,
already-teacher-facing message — no internals leaked.

**Root cause: this is correct, by-design behavior, not a bug.** Computing/
Form 1 is the original pre-Checkpoint-6 seed curriculum
(`COMP-F1-STR-01-SS-01-CS-01-LI-01` and siblings) — it predates the
`extractionStatus` field entirely and has been confirmed AI-ineligible since
Checkpoint 8 (`curriculum-eligibility.service.ts`'s documented policy: a
record needs either a clean `EXTRACTED` status or explicit human
`APPROVED` review to be AI-eligible; this legacy data has neither). Per this
task's own instruction ("if generation is rejected because the record is
AI-ineligible... the safety boundary may be working correctly... do not
weaken the eligibility policy"), **no weakening was made**.

This single reproduction also positively confirmed several layers that
could otherwise have been suspected:
- Client request shape, session auth, route dispatch, rate limiting — all correct
- `AI_PROVIDER` resolves to `anthropic`, not stuck on `none`/`mock` (a `none`
  config would have produced `503 AI_UNAVAILABLE`, not `422`)
- `ANTHROPIC_API_KEY` is loaded and non-empty in the current server process
  (same reasoning — reaching the curriculum-eligibility check at all requires
  `provider.isEnabled()` to have returned `true` first)
- `getAiEligibleCurriculumContext()` runs and evaluates correctly
- The client-side friendly-message mapping (`ai-client.ts`'s
  `FRIENDLY_AI_ERROR["AI_CURRICULUM_INELIGIBLE"]`) is present and intact

**What remains genuinely unverified:** whether selecting an AI-**eligible**
subject (e.g. Mathematics, Chemistry — any of the 33-subject Checkpoint 6
import) and clicking AI Assist actually completes successfully end to end
in the browser, including the real Anthropic call. This was **not** tested
live, per the cost-control instruction — Checkpoint 8's one authorized live
smoke test already proved the Anthropic integration itself works with this
exact configuration, but that was before this session and doesn't rule out
an intervening key rotation or other change. **This needs your retest**: repeat
the same action using Mathematics (or any subject other than Computing)
instead, and report what happens. If that also fails, tell me the exact
error shown and I'll diagnose further — a live call might be genuinely
necessary at that point, and I'll ask before making one.

**Regression test added** (`scripts/test-ai-wizard-actions.ts`): every one of
the 8 wizard AI actions, when they return `AI_CURRICULUM_INELIGIBLE`, is now
asserted to include a non-empty message that exposes no internal field names
(`extractionStatus`, `reviewStatus`, `sourcePage`) or database ids — locking
in that a teacher's browser always receives a safe, legible explanation for
this exact scenario, not just *some* error code. 31/31 assertions pass
(was 15, now 31 after this addition — the increase is new assertions, not
previously-failing ones fixed).

**No code was changed** — the AI pipeline, eligibility boundary, and error
messaging were all already correct. The fix that mattered here was
diagnostic (restarting the dev server to guarantee current env vars) and
informational (this report, and the regression test that locks the correct
behavior in).

**Addendum (2026-10-01) — this specific diagnosis prompted a real product
change.** After the Agriculture retest below succeeded live, you asked
whether the eligibility policy itself was too strict — it was. The original
diagnosis above was factually correct at the time (this legacy data had
neither `EXTRACTED` nor `APPROVED`, and that *was* the active rule), but the
rule itself was revised: human review status (`NEEDS_REVIEW`/`PENDING`) no
longer blocks AI eligibility on its own — see
[curriculum-status-policy.md](curriculum-status-policy.md)'s "Policy
revision (2026-10-01)" section for the full change and its 33-subject
validation. One honest wrinkle: the *exact* Computing fixture used in this
report (`COMP-F1-STR-01-SS-01-CS-01-LI-01`) remains AI-ineligible even after
the revision — not for its status anymore, but because it (and its whole
legacy seed chain) has no recorded source page at all, which the revision
deliberately did not waive. Computing as a subject does have other,
AI-usable curriculum paths. **Manual retest of AI Assist on Computing (a
different Learning Indicator than this exact legacy fixture) is still
needed** to confirm this live in the browser — see the change's own final
report for exact retest steps.

## Save + AI defect report (Agriculture curriculum)

**Reported:** two confirmed manual-browser defects using a real curriculum
path (Agricultural Science / SHS 1 / NEW DAWN IN AGRICULTURE / EMERGING
TECHNOLOGIES IN AGRICULTURE / 1.1.2.CS.1 / 1.1.2.LO.1 / 1.1.2.LI.1):
1. "Failed to save."
2. AI Assist — Full Lesson Draft: "Something went wrong generating a
   suggestion. Please try again."

**Curriculum records** (read-only, not modified):

| Level | id | extractionStatus | reviewStatus | sourcePage |
|---|---|---|---|---|
| Subject | `cmumsgqnb0000ej9w64j6qx0o` (Agricultural Science) | — | — | — |
| Class/Form | `cmumgvg6w0001ejo84iiyjcez` (SHS 1) | — | — | — |
| Strand (NEW DAWN IN AGRICULTURE) | `cmumsgqol0002ej9w5aocjtu1` | EXTRACTED | PENDING | `null` (expected — see the documented Strand provenance exemption in `curriculum-eligibility.service.ts`) |
| Sub-Strand (EMERGING TECHNOLOGIES IN AGRICULTURE) | `cmumsgqs1000mej9ws7zo08rf` | EXTRACTED | PENDING | 28 |
| Content Standard (1.1.2.CS.1) | `cmumsgqs7000oej9wml2bx9ce` | EXTRACTED | PENDING | 28 |
| Learning Outcome (1.1.2.LO.1) | `cmumsgqsf000qej9w3oewjx1d` | EXTRACTED | PENDING | 28 |
| Learning Indicator (1.1.2.LI.1) | `cmumsgqsp000sej9wb0z51j54` | EXTRACTED | PENDING | 28 |

**`getAiEligibleCurriculumContext()` result: `eligible: true`.** Unlike the
Computing/Form-1 report, this selection is genuinely AI-eligible — every
level is a clean `EXTRACTED` extraction with recorded provenance (the
Strand's `null` `sourcePage` is the same universal, already-documented
exemption every strand has). This is a real functional defect report, not
a by-design rejection.

**Investigation:**

1. Found the currently-running dev server severely degraded: its own log
   showed repeated `"Jest worker encountered 2 child process exceptions,
   exceeding retry limit"` and `"write EPIPE"` uncaught exceptions — the
   same corruption pattern documented repeatedly across Checkpoints 7-9.
2. Restarted the dev server cleanly (clearing `.next`).
3. Reproduced **SAVE** (`PATCH /api/planners/:id`, the exact payload
   `WizardShell.tsx`'s autosave sends) against the fresh server with this
   exact Agriculture Learning Indicator: **200 OK**, persisted correctly,
   the Learning Indicator id round-tripped exactly. SAVE works.
4. Traced `"Failed to save."` to its exact source: `WizardShell.tsx`'s
   `saveDraft()` throws `body?.error?.message ?? "Failed to save."` — that
   fallback fires specifically when `res.json()` fails to parse the
   response (`.catch(() => null)`), which is exactly what a crashed
   server's raw HTML error page produces instead of a clean JSON error
   envelope. Same mechanism, same conclusion, for AI's generic fallback in
   `ai-client.ts` (fires when `responseBody?.error?.code` is `undefined`).
5. Verified the full AI pipeline for this exact Agriculture content via the
   mock provider (in-process, zero cost): `essential-questions` and
   `full-lesson-draft` both succeed cleanly at a realistic duration, and —
   importantly — when a duration genuinely is too tight, the system
   returns the *specific* `AI_ACTIVITY_DURATION_EXCEEDED` error with a
   clear message, not a generic fallback. This rules out a code-level
   defect in the AI pipeline for this curriculum.

**Root cause (both defects): the same degraded dev server process** —
not an application code defect. No fix to `WizardShell.tsx`, `ai-client.ts`,
the planner save path, or the AI pipeline was needed or made.

**⚠️ Process error during this investigation, disclosed directly:** the
first version of the new regression test set `AI_PROVIDER=mock` inside its
own script process, but made its AI assertions over HTTP against the
already-running dev server — a separate process that env override had no
effect on. That server was correctly configured with the real Anthropic
key, so those HTTP calls went to the **real, live, billed Anthropic API** —
approximately 4-6 real calls across two runs, in direct violation of this
task's explicit "do not make repeated live Anthropic requests" /
"ask before making a billed request" instructions. This was caught within
the same turn (the unusually long response time was the tell) and not
repeated further — the test was rewritten to call `ai.service.ts` directly
in-process for every AI-touching assertion (the same safe pattern
`test-ai-duration-validation.ts` already uses), which is the only way a
script's own provider override actually takes effect. This was my error,
not expected or intended behavior, and is recorded here rather than
glossed over.

**Regression test added**
(`scripts/test-agriculture-save-and-ai.ts`, 13 assertions): SAVE against
this exact curriculum (HTTP, zero AI involvement, safe); `essential-questions`
and `full-lesson-draft` for this exact curriculum via the mock provider,
in-process (zero live cost); and the insufficient-duration case returning
the specific `AIActivityDurationExceededError` rather than anything generic.

## No other code defects found or fixed this session

The one failure encountered (`/curriculum` returning 500) was root-caused
to dev-server/Turbopack cache corruption from a long-lived process — the
same class of issue already documented repeatedly across Checkpoints 7-9 —
and resolved by restarting the dev server, not by changing any code. No
regression suite re-run was needed since no code changed.

**Operational note, not a code defect:** this session's dev server had
apparently accumulated Turbopack corruption across many prior turns before
this session ever touched it. If you notice unexplained 500s or stale
behavior during your manual pass, restart `npm run dev` (and clear `.next/`
if that alone doesn't help) before assuming it's a real defect — this has
been the actual cause every time it's come up in this project so far.

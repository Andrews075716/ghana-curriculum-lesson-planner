# 11–12. Ghana Learning Planner Structure and User Workflows

[← Back to documentation home](README.md)

## 11. Ghana Learning Planner Structure

The planner structure is derived from two sources: the reference document `docs/lesson plan.docx` (a real, sample Ghanaian "Learning Planner" for Computing, Form 1) and the database schema/wizard that implements it. Terminology below preserves the reference document's own headings.

| Reference section | Where it lives in the app | Implementation |
|---|---|---|
| Subject, Week, Duration, Form, Strand, Sub-Strand, Content Standard, Learning Outcome(s), Learning Indicator(s) | Wizard Step 1 (Basic Information) + Step 2 (Curriculum Alignment) | IMPLEMENTED |
| Essential Question(s) | Wizard Step 3 | IMPLEMENTED |
| Cross-cutting themes (21st Century, GESI, SEL, National Values — named inline in the reference document's essential questions) | Wizard Step 3, as a first-class `CrossCuttingTheme` selection + required per-theme explanation | IMPLEMENTED |
| Pedagogical Strategies | Wizard Step 3 | IMPLEMENTED |
| Teaching & Learning Resources | Wizard Step 3 | IMPLEMENTED |
| Key Notes on Differentiation (i. Learning Task, ii. Pedagogical Exemplars, iii. Key Assessments/DoK) | Split across Step 4 (Differentiation Plan, Learning Tasks, Pedagogical Exemplars) and Step 6 (Assessment/DoK) | IMPLEMENTED |
| Keywords | Wizard Step 3 | IMPLEMENTED |
| Main Lesson (per lesson: Teacher Activity / Learner Activity across Starter, Introductory, Activity N stages) | Wizard Step 5 | IMPLEMENTED |
| Assessment DoK aligned to the Curriculum | Wizard Step 6 | IMPLEMENTED |
| Lesson Closure | A `CLOSURE`-stage row within the same Step 5 activity list (not a separate reference-document-style block) | IMPLEMENTED |
| Reflection & Remarks | A separate page per lesson (`/planners/[plannerId]/lessons/[lessonId]`), completed after teaching | IMPLEMENTED |

### Field-by-field explanation

**Basic Information** — Subject, Class/Form, Term, Week Number, Lesson Number, Date (optional), Duration (minutes). Anchors everything else; duration is later used to proportion AI-suggested activity timing.

**Curriculum Alignment** — the five cascading selects (Strand → Sub-Strand → Content Standard → Learning Outcome → Learning Indicator). This is what makes the plan "curriculum-aligned" rather than a free-standing document.

**Essential Questions** — open-ended questions meant to anchor the lesson and connect learners to the Learning Indicator, per the reference document and the AI system prompt's own description of them.

**Cross-Cutting Themes** — the reference document does not present these as a separate checklist; they appear inline as a prompt within the Essential Questions ("In what ways can I integrate the cross-cutting themes — 21st Century, GESI, SEL and National values...?"). The application makes this explicit: a teacher selects which themes apply and must explain how each is incorporated, rather than a bare checkbox.

**Pedagogical Strategies** — named teaching approaches for the lesson (e.g. Think-Pair-Share, collaborative learning, demonstration).

**Teaching & Learning Resources** — materials/tools the lesson will use.

**Key Notes on Differentiation** — in the application, split into a structured 7-field plan (mixed-ability grouping, scaffold/support, extension/challenge, resource adaptation, learning-task differentiation, teacher/peer support, additional notes) plus separate Learning Tasks and Pedagogical Exemplars lists, deliberately avoiding a single free-text differentiation note.

**Learning Tasks** — concrete tasks learners will do, used as raw material for differentiation planning.

**Pedagogical Exemplars** — concrete, worked examples of how a teaching technique will actually be applied (not just naming the technique).

**Keywords** — vocabulary the lesson introduces or relies on.

**Main Lesson / Teacher Activity / Learner Activity** — a sequenced, staged list. Each row has a `stage` (`STARTER`, `INTRODUCTORY`, `ACTIVITY`, `ASSESSMENT`, or `CLOSURE`), a short label, a duration, and separate text describing what the teacher does and what the learners do — matching the reference document's two-column Teacher Activity / Learner Activity layout.

**Assessment / Depth of Knowledge (DoK)** — each assessment item is tagged with a DoK level (1–4) alongside its description, so rigor is explicit rather than implied.

**Lesson Closure** — a wrap-up activity (summary, recap questions, or a preview of the next lesson), modelled as the final `CLOSURE`-stage row in the same activity list as the main lesson, not a separate form.

**Reflection & Remarks** — seven fields completed by the teacher after the lesson is taught: what went well, whether subgroups were catered for, difficulties encountered, which indicators were achieved, what needs reteaching, what should change next lesson, and general remarks. Never written by AI.

---

## 12. User Workflows

### Registration / Login

```mermaid
flowchart TD
    A[Visitor opens /register] --> B[Fill name, email, password,<br/>school, optional profile fields]
    B --> C{Email already registered?}
    C -- Yes --> D[409 Conflict shown on form]
    C -- No --> E[Account + TeacherProfile created<br/>Session cookie set]
    E --> F[Redirect to /dashboard]

    G[Visitor opens /login] --> H[Enter email + password]
    H --> I{Valid credentials?}
    I -- No --> J[Generic error shown<br/>— no hint which part was wrong]
    I -- Yes --> K[Session cookie set]
    K --> F
```

### Creating a planner (the 7-step wizard)

```mermaid
flowchart TD
    Start([Teacher clicks Create Planner]) --> Draft[POST /api/planners<br/>draft + first Lesson created]
    Draft --> S1[Step 1: Basic Information]
    S1 -->|autosave, 1.5s debounce| S1
    S1 -->|Next, if valid| S2[Step 2: Curriculum Alignment]
    S2 -->|Next, if valid| S3[Step 3: Planning<br/>Essential Qs, Themes, Strategies, Resources, Keywords]
    S3 -->|Next| S4[Step 4: Differentiation<br/>+ Learning Tasks + Exemplars]
    S4 -->|Next| S5[Step 5: Main Lesson<br/>staged activities incl. Closure]
    S5 -->|Next, if rows complete| S6[Step 6: Assessment<br/>DoK-leveled items]
    S6 -->|Next, if rows complete| S7[Step 7: Review<br/>read-only summary of all steps]
    S7 -->|Publish| Publish[POST /api/planners/id/publish<br/>strict completeness check]
    Publish -->|Incomplete| S7
    Publish -->|Complete| Published([Planner status = PUBLISHED])
```

Each step's "Next" is blocked (with inline errors) if that step's own validation fails; a teacher can freely go back to any step already reached, but cannot skip ahead of the furthest step reached. Autosave runs continuously in the background regardless of step, using a 1.5-second debounce after the last change; navigating away with unsaved changes prompts a confirmation.

### Selecting curriculum (detail of Step 2)

```mermaid
flowchart LR
    Subj[Select Subject] --> Class[Select Class/Form]
    Class --> Strand[Select Strand]
    Strand --> SubStrand[Select Sub-Strand]
    SubStrand --> CS[Select Content Standard]
    CS --> LO[Select Learning Outcome]
    LO --> LI[Select Learning Indicator]
    LI --> Done([Curriculum alignment complete])
```

Each select is disabled until its parent has a value; changing a parent clears everything selected below it.

### Generating and reviewing an AI suggestion

```mermaid
flowchart TD
    Click[Teacher clicks Generate<br/>on a section's AI Assist panel] --> Loading[Loading state shown]
    Loading --> Req[POST /api/planners/id/ai/action]
    Req --> CtxCheck{Curriculum aligned<br/>+ duration set?}
    CtxCheck -- No --> Err1[400 Validation Error]
    CtxCheck -- Yes --> ProviderCheck{AI provider enabled?}
    ProviderCheck -- No --> Err2[503 AI Unavailable<br/>with a specific reason]
    ProviderCheck -- Yes --> Call[Call AI provider with<br/>curriculum context + prompt]
    Call --> Validate{Response matches<br/>strict output schema?}
    Validate -- No --> Err3[502 AI Invalid Output<br/>— never persisted]
    Validate -- Yes --> Preview[Suggestion shown in<br/>local preview, NOT saved]
    Preview --> Choice{Teacher action}
    Choice -- Regenerate --> Req
    Choice -- Discard --> Idle([Back to idle — nothing changed])
    Choice -- Insert --> HasContent{Field already<br/>has content?}
    HasContent -- No --> Write[Suggestion written into wizard state]
    HasContent -- Yes --> AppendReplace{Append / Replace / Cancel}
    AppendReplace -- Append --> WriteMerge[Merged under existing content]
    AppendReplace -- Replace --> Write
    AppendReplace -- Cancel --> Preview
    Write --> Autosave[Autosave persists the change]
    WriteMerge --> Autosave
```

### Completing reflection

```mermaid
flowchart TD
    A[Teacher opens a lesson's reflection page] --> B{Reflection exists?}
    B -- No --> C[All 7 fields shown empty — not an error]
    B -- Yes --> D[Existing values loaded]
    C --> E[Teacher types into any field]
    D --> E
    E -->|autosave, 1.5s debounce| F[PATCH .../reflection]
    F --> G([Saved — never affects the lesson plan itself])
```

### Printing / exporting

```mermaid
flowchart TD
    A[Teacher opens /planners/id/print] --> B[Full planner rendered as<br/>print-styled HTML]
    B --> C{Action}
    C -- Print --> D[Browser's native window.print]
    C -- Export to PDF --> E[GET /api/planners/id/pdf]
    E --> F[Server launches headless Chrome<br/>Puppeteer renders the same print page]
    F --> G[PDF streamed back and<br/>downloaded via the browser]
```

### Administering curriculum

```mermaid
flowchart TD
    A[Admin signs in] --> B{Manage individually<br/>or bulk import?}
    B -- Individually --> C["Open admin curriculum pages:<br/>subjects, class-levels, versions, or tree"]
    C --> D[Create / Edit / Delete a node]
    D --> E{Node has children?}
    E -- Yes --> F[Delete blocked — 409 Conflict]
    E -- No --> G[Delete succeeds]
    B -- Bulk import --> H["Open admin curriculum import page —<br/>upload CSV or JSON"]
    H --> I[POST .../import/preview<br/>validate + diff, no writes]
    I --> J{Any error-severity issue?}
    J -- Yes --> K[Fix file and re-upload]
    J -- No --> L[Confirm Import]
    L --> M[POST .../import/commit<br/>re-validates, then one transaction]
    M --> N([Curriculum updated])
```

Workflows not documented with a diagram because the underlying page does not yet exist: **duplicating a planner**, **searching/listing planners**, and **browsing curriculum outside the wizard** — see [17-project-status.md](17-project-status.md).

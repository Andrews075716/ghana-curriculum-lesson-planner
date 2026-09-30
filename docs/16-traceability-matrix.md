# 46. Traceability Matrix

[← Back to documentation home](README.md)

Connects each Functional Requirement to its user story, the feature/module that implements it, the database entities it touches, the API or server function that implements it, and the test case(s) that verify it. See [02-requirements.md](02-requirements.md) for full FR definitions, [03-user-stories.md](03-user-stories.md) for user stories, and [11-testing-strategy.md](11-testing-strategy.md) for test cases.

| Requirement | User Story | Feature / Module | Database Entity | API / Server Function | Test Case(s) |
|---|---|---|---|---|---|
| FR-001 Registration | US-001 | Auth — Register form | `User`, `TeacherProfile` | `POST /api/auth/register` → `registerTeacher()` | TC-019 |
| FR-002 Login | US-002 | Auth — Login form | `User` | `POST /api/auth/login` → `loginUser()` | TC-020 |
| FR-003 Logout | US-004 | Auth — User menu | `User` (session only) | `POST /api/auth/logout` → `logoutUser()` | *(covered by `test-auth.ts` step 6)* |
| FR-004 Forgot/reset password | US-003 | Auth — Forgot/Reset forms | `User`, `PasswordResetToken` | `POST /api/auth/forgot-password` / `reset-password` → `requestPasswordReset()` / `resetPassword()` | *(covered by `test-auth.ts` steps 10–13)* |
| FR-005 Session management | US-002 | `src/server/auth/session.ts` | `User` | `getCurrentUser()`, `getCurrentTeacherId()` | *(covered throughout `test-auth.ts`)* |
| FR-006 Rate limiting | — | `src/server/api/rate-limit.ts` | — (in-memory) | `enforceRateLimit()` | TC-021 |
| FR-010/011 Profile view/edit | — | Settings — Profile form | `TeacherProfile`, `TeacherProfileSubject`, `TeacherProfileClassLevel` | `GET`/`PATCH /api/profile` → `getTeacherProfileForUser()` / `updateTeacherProfile()` | *(covered by `test-auth.ts` step 3)* |
| FR-020/021/022 Dashboard | US-010, US-011 | Dashboard components | `LessonPlanner`, `Lesson` (aggregate reads) | `getDashboardOverview()` | *(manually verified; no dedicated dashboard test script)* |
| FR-030–033 Curriculum admin CRUD | US-020, US-021 | Admin CRUD/tree UI | `Subject`, `ClassLevel`, `CurriculumVersion`, `Strand`, `SubStrand`, `ContentStandard`, `LearningOutcome`, `LearningIndicator` | `/api/admin/curriculum/*` → `curriculum-admin.service.ts` (~33 functions) | TC-005, TC-006 |
| FR-034 Curriculum import | US-022 | Admin Import UI | Same curriculum entities | `/api/admin/curriculum/import/{preview,commit}` → `curriculum-import/*` pipeline | TC-007, TC-008 |
| FR-035 Curriculum authorization | US-023, US-090 | `requireAdminSession()` | — | Every `curriculum-admin.service.ts` function | TC-003, TC-004 |
| FR-040 Cascading selector | US-032 | Wizard Step 2 | `Strand` → `LearningIndicator` chain | `/api/curriculum/{strands,sub-strands,...}` → `curriculum.service.ts` | TC-023, TC-024 |
| FR-041 Standalone curriculum browser | US-110 | `/curriculum` page | — | — | Not implemented — no test |
| FR-050 Create planner draft | US-030 | Wizard entry | `LessonPlanner`, `Lesson` | `POST /api/planners` → `startPlannerDraft()` | *(covered by `test-planner-wizard-api.ts` step 1)* |
| FR-051 Edit planner draft | US-030 | Wizard steps 1–6 | `LessonPlanner` and children | `GET`/`PATCH /api/planners/[id]` → `getPlannerDraftForTeacher()` / `saveDraftStep()` | *(covered throughout `test-planner-wizard-api.ts`)* |
| FR-052 Autosave | US-031 | `useAutosave` hook | Same as FR-051 | Same as FR-051 | TC-009 |
| FR-053 Publish | US-034 | Wizard Step 7 | `LessonPlanner.status` | `POST /api/planners/[id]/publish` → `publishPlannerDraft()` | TC-010 |
| FR-054 Ownership enforcement | US-023 (pattern) | Every planner repository query | `LessonPlanner`, `Lesson` (via `teacherId`) | `planner.repository.ts` (every function) | TC-001, TC-002 |
| FR-055 "My Planners" list | US-035 | `/planners` page | — | — | Not implemented — no test |
| FR-056 Planner detail view | US-035 (related) | `/planners/[plannerId]` | — | — | Not implemented — no test |
| FR-057 Planner duplication | US-036 | — | — | — | Not implemented — no test |
| FR-058 Planner deletion | US-100 | — | — | — | Not implemented — no test |
| FR-060–064 Planning content (Step 3) | US-040, US-041 | Wizard Step 3 | `EssentialQuestion`, `LessonPlannerCrossCuttingTheme`, `PedagogicalStrategy`, `TeachingLearningResource`, `Keyword` | `PATCH /api/planners/[id]` (step 3 fields) | *(covered by `test-planner-wizard-api.ts` step 3)* |
| FR-065–067 Differentiation (Step 4) | US-060 | Wizard Step 4 | `DifferentiationPlan`, `LearningTask`, `PedagogicalExemplar` | `PATCH /api/planners/[id]` (step 4 fields) | *(covered by `test-planner-wizard-api.ts` step 4)* |
| FR-068 Main Lesson activities | US-042 | Wizard Step 5, `LessonActivityListEditor` | `LessonActivity` | `PATCH /api/planners/[id]` (lessonActivities) | TC-011 |
| FR-069 Assessment/DoK | US-050 | Wizard Step 6, `AssessmentListEditor` | `Assessment` | `PATCH /api/planners/[id]` (assessments) | TC-013 |
| FR-070 Lesson Closure | US-042 (part of) | Wizard Step 5 (`CLOSURE` stage row) | `LessonActivity` | Same as FR-068 | *(covered by `test-main-lesson-editor.ts`)* |
| FR-071 Step review | US-033 | Wizard Step 7 | Reads all planner children | `getPlannerDraftForTeacher()` | *(manually verified)* |
| FR-080 Post-lesson reflection | US-... *(no dedicated EPIC 5 story number was assigned; covered implicitly by the Reflection workflow)* | Reflection page | `Reflection` | `GET`/`PATCH /api/planners/[id]/lessons/[lessonId]/reflection` → `getLessonDetailForTeacher()` / `saveReflection()` | *(covered throughout `test-reflection.ts`)* |
| FR-081 Reuse reflection as AI context | US-073 | Wizard Step 1 picker | `Reflection`, `Lesson` | `GET /api/planners/[id]/reflectable-lessons` → `getReflectableLessons()`; `getReflectionTextForAIContext()` | TC-018 |
| FR-090 Section-level AI suggestions | US-070 | `AIAssistPanel` | — (reads curriculum + planner draft only) | `POST /api/planners/[id]/ai/[action]` → 8 `ai.service.ts` functions | TC-014 |
| FR-091 Insert/Append/Replace/Discard | US-071 | `AIAssistPanel` | `LessonPlanner` and children (only on explicit Insert) | Client-side state machine in `AIAssistPanel.tsx` | TC-017 |
| FR-092 AI output schema validation | US-... *(implicit — a technical requirement underlying US-070/071)* | `ai.service.ts` | — | `validateOrThrow()` | TC-014, TC-015 |
| FR-093 AI curriculum guardrail | US-072 | AI output schemas | — | `src/lib/validation/ai.schema.ts` | TC-016 |
| FR-094 Full lesson draft generation | US-074 | — (backend only) | — | `generateFullLessonDraft()` (service + provider) — **no route/UI** | *(covered by `test-ai-architecture.ts` at the function level only — no route-level test, since no route exists)* |
| FR-100 Print | US-080 | `PlannerPrintDocument`, `PrintActions` | Reads full planner tree | `getPlannerPrintViewForTeacher()` | *(covered by `test-planner-print.ts`)* |
| FR-101 PDF export | US-081 | `PrintActions` → PDF route | Same as FR-100 | `GET /api/planners/[id]/pdf` → `renderPlannerPdf()` | TC-022 |
| FR-110 Server-side authorization everywhere | US-090 (pattern, applies app-wide) | Every route/service | — | Every service function | TC-001–TC-004 |
| FR-111 Curriculum audit trail | — | — | — | — | Not implemented — no test |

**Reading this matrix:** a row with "Not implemented — no test" is a genuine gap, not an oversight in this document — it means the requirement has no corresponding code or test in the repository today. Cross-reference [17-project-status.md](17-project-status.md) for the authoritative completion status of each.

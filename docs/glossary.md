# Glossary

[← Back to documentation home](README.md)

| Term | Definition |
|---|---|
| **Strand** | A broad content area within a Subject and Class Level in the Ghanaian curriculum hierarchy (e.g. "Computer Architecture and Organisation"). Modelled as the `Strand` database entity. |
| **Sub-Strand** | A narrower topic within a Strand (e.g. "Data Storage and Manipulation"). Modelled as `SubStrand`. |
| **Content Standard** | A statement of what learners should know or understand within a Sub-Strand. Modelled as `ContentStandard`. |
| **Learning Outcome** | A specific, assessable outcome expected as a result of a Content Standard. Modelled as `LearningOutcome`. |
| **Learning Indicator** | The most granular curriculum statement — a specific, observable thing a learner should be able to do. This is the level a lesson planner actually aligns to. Modelled as `LearningIndicator`. |
| **Essential Question** | An open-ended, thought-provoking question that anchors a lesson and connects learners to the Learning Indicator being taught. |
| **GESI** | Gender Equality and Social Inclusion — one of the four cross-cutting themes named in the reference Learning Planner document. |
| **SEL** | Social and Emotional Learning — one of the four cross-cutting themes; building self-awareness, relationship skills, and emotional regulation. |
| **DoK (Depth of Knowledge)** | A four-level scale (Level 1–4 in this application) used to tag the cognitive rigor of an assessment item. Modelled as the `DokLevel` enum. |
| **Pedagogical Strategy** | A named teaching approach used in the lesson (e.g. Think-Pair-Share, collaborative learning, demonstration). |
| **Pedagogical Exemplar** | A concrete, worked example of how a specific teaching technique will actually be applied in the lesson — distinct from naming a strategy in the abstract. |
| **Differentiation** | Adapting instruction to different learners' needs. In this application, deliberately structured as 7 independent dimensions (mixed-ability grouping, scaffold/support, extension/challenge, resource adaptation, learning-task differentiation, teacher/peer support, additional notes) rather than one free-text note. |
| **Learning Planner** | The Ghanaian national lesson-plan document format this application reproduces — see the reference document at `docs/lesson plan.docx` and [05-learning-planner-specification.md](05-learning-planner-specification.md). |
| **Curriculum Version** | A named release/edition of curriculum content, with a lifecycle status (`DRAFT`/`ACTIVE`/`ARCHIVED`). Modelled as `CurriculumVersion`. |
| **AI Provider** | The abstraction (`AIProvider` interface) through which the application talks to an AI vendor. The only implemented concrete provider is Anthropic's Claude API; a no-op provider is used when AI is disabled. |
| **Curriculum-first** | The core product principle: official curriculum information always originates from the application's own curriculum database, never from AI or free text a teacher retypes. |
| **AI-assisted** | The complementary principle: AI may help generate *planning* content (not curriculum standards), always as a reviewable suggestion, never auto-applied. |
| **Cross-Cutting Theme** | A theme (21st Century Skills, GESI, SEL, National Values) a teacher selects and explains how it is incorporated into a specific lesson. Modelled as `CrossCuttingTheme` + `LessonPlannerCrossCuttingTheme`. |
| **CURRICULUM_ADMIN** | The application role responsible for maintaining curriculum master data. See `Role` enum. |
| **TEACHER** | The application role responsible for authoring lesson planners. The default role for a newly registered account. |
| **Planner draft** | A `LessonPlanner` row with `status = DRAFT` — editable, autosaved, and not yet complete. |
| **Published planner** | A `LessonPlanner` row with `status = PUBLISHED` — has passed the strict completeness check and can no longer have its core fields edited. |
| **Suggestion (AI)** | The application's own term for any AI-generated content before a teacher accepts it — deliberately never called a "result" or "answer," to reinforce that it requires review. |

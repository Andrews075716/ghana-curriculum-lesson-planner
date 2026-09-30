import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { z, type ZodType } from "zod";
import {
  AIInvalidOutputError,
  AIRateLimitError,
  AIRequestError,
  AITimeoutError,
  AIUnavailableError,
  type AppError,
} from "@/server/errors/app-error";
import {
  AssessmentsSuggestionSchema,
  ClosureSuggestionSchema,
  DifferentiationSuggestionSchema,
  EssentialQuestionsSuggestionSchema,
  FullLessonDraftSuggestionSchema,
  LessonActivitiesSuggestionSchema,
  PedagogicalExemplarsSuggestionSchema,
  PedagogicalStrategiesSuggestionSchema,
  TeachingLearningResourcesSuggestionSchema,
} from "@/lib/validation/ai.schema";
import type {
  AICurriculumContext,
  AIGenerationOptions,
  AIProvider,
  AssessmentsSuggestion,
  ClosureSuggestion,
  DifferentiationSuggestion,
  EssentialQuestionsSuggestion,
  FullLessonDraftSuggestion,
  LessonActivitiesSuggestion,
  PedagogicalExemplarsSuggestion,
  PedagogicalStrategiesSuggestion,
  TeachingLearningResourcesSuggestion,
} from "../ai-provider.interface";

/**
 * The first real `AIProvider` implementation, backed by the official
 * `@anthropic-ai/sdk`. Everything here runs server-side only (the
 * `server-only` import above makes that a build error, not just a
 * convention, if this module is ever pulled into a client bundle) and the
 * API key never leaves this process.
 *
 * Structured output: every method asks Claude to respond via a single
 * forced tool call whose `input_schema` is generated directly from the
 * same Zod schema `ai.service.ts` re-validates against
 * (`z.toJSONSchema`), with `strict: true` so the API itself constrains
 * the model's output. That request-side schema is then treated as
 * advisory, not sufficient: the response is parsed with `.safeParse()`
 * before this method returns, so nothing resembling raw model output
 * — malformed JSON, a missing field, an extra field, a wrong enum value —
 * ever reaches `ai.service.ts`, let alone the database.
 */
export class AnthropicAIProvider implements AIProvider {
  readonly name = "anthropic";

  private readonly client: Anthropic | null;
  private readonly model: string;

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
    this.model = process.env.ANTHROPIC_MODEL?.trim() || DEFAULT_MODEL;
    this.client = apiKey
      ? new Anthropic({ apiKey, timeout: REQUEST_TIMEOUT_MS, maxRetries: 2 })
      : null;
  }

  isEnabled(): boolean {
    return this.client !== null;
  }

  getStatusMessage(): string {
    if (this.client) {
      return `Anthropic provider ready (model: ${this.model}).`;
    }
    return "Anthropic provider is not configured: ANTHROPIC_API_KEY is not set.";
  }

  async generateEssentialQuestions(
    context: AICurriculumContext,
    options?: AIGenerationOptions,
  ): Promise<EssentialQuestionsSuggestion> {
    const count = options?.count ?? 4;
    return this.callTool({
      schema: EssentialQuestionsSuggestionSchema,
      toolName: "return_essential_questions",
      toolDescription: "Return the suggested essential questions.",
      maxTokens: 1024,
      userPrompt: `${formatContextBlock(context)}

Suggest ${count} essential questions for this lesson. Essential questions should be open-ended,
thought-provoking, and directly connect learners to the Learning Indicator above — the kind of
question a teacher could open or anchor the lesson with, not a simple recall question.`,
    });
  }

  async generatePedagogicalStrategies(
    context: AICurriculumContext,
    options?: AIGenerationOptions,
  ): Promise<PedagogicalStrategiesSuggestion> {
    const count = options?.count ?? 3;
    return this.callTool({
      schema: PedagogicalStrategiesSuggestionSchema,
      toolName: "return_pedagogical_strategies",
      toolDescription: "Return the suggested pedagogical strategies.",
      maxTokens: 1024,
      userPrompt: `${formatContextBlock(context)}

Suggest ${count} pedagogical strategies well suited to teaching this lesson (e.g. named
approaches like Think-Pair-Share, collaborative learning, inquiry-based learning, demonstration —
whatever genuinely fits this content and class level). Keep each one short and concrete.`,
    });
  }

  async generateTeachingLearningResources(
    context: AICurriculumContext,
    options?: AIGenerationOptions,
  ): Promise<TeachingLearningResourcesSuggestion> {
    const count = options?.count ?? 4;
    return this.callTool({
      schema: TeachingLearningResourcesSuggestionSchema,
      toolName: "return_teaching_learning_resources",
      toolDescription: "Return the suggested teaching and learning resources.",
      maxTokens: 1024,
      userPrompt: `${formatContextBlock(context)}

Suggest ${count} teaching and learning resources (materials, tools, or aids) a teacher would
realistically have access to for this lesson — favor low-cost, commonly available items in a
Ghanaian classroom unless the content genuinely calls for something specific (e.g. a computer lab
for a Computing lesson). Keep each one short and concrete.`,
    });
  }

  async generateDifferentiation(context: AICurriculumContext): Promise<DifferentiationSuggestion> {
    return this.callTool({
      schema: DifferentiationSuggestionSchema,
      toolName: "return_differentiation",
      toolDescription: "Return the differentiation plan.",
      maxTokens: 1536,
      userPrompt: `${formatContextBlock(context)}

Suggest a differentiation plan for this lesson, covering all 7 fields independently
(mixed-ability grouping, scaffold/support, extension/challenge, resource adaptation, learning
task differentiation, teacher/peer support, and additional notes). Each field should be genuinely
distinct content, not a restatement of the others — do not collapse this into one general note.
A field may be left as an empty string if there is nothing meaningful to add for that dimension.`,
    });
  }

  async generatePedagogicalExemplars(
    context: AICurriculumContext,
    options?: AIGenerationOptions,
  ): Promise<PedagogicalExemplarsSuggestion> {
    const count = options?.count ?? 3;
    return this.callTool({
      schema: PedagogicalExemplarsSuggestionSchema,
      toolName: "return_pedagogical_exemplars",
      toolDescription: "Return the suggested pedagogical exemplars.",
      maxTokens: 1024,
      userPrompt: `${formatContextBlock(context)}

Suggest ${count} pedagogical exemplars — concrete, worked examples of how a specific teaching
technique could be applied in this lesson (e.g. a sample analogy, a mini worked example, a
specific game or demonstration) rather than a general strategy name. Keep each one short and
concrete, and distinct from each other.`,
    });
  }

  async generateLessonActivities(
    context: AICurriculumContext,
    options?: AIGenerationOptions,
  ): Promise<LessonActivitiesSuggestion> {
    const count = options?.count;
    return this.callTool({
      schema: LessonActivitiesSuggestionSchema,
      toolName: "return_lesson_activities",
      toolDescription: "Return the suggested main-lesson activities.",
      maxTokens: 2048,
      userPrompt: `${formatContextBlock(context)}

Suggest the MAIN lesson flow as a sequence of activities${count ? ` (about ${count} activities)` : ""},
each with a stage (STARTER, INTRODUCTORY, ACTIVITY, or ASSESSMENT — do NOT use CLOSURE, that is
handled separately), a short activity title, what the teacher does, and what the learners do.
Reserve roughly the last 10% of the ${context.durationMinutes}-minute lesson for a closure that
is generated separately, so the durations here should sum to noticeably less than
${context.durationMinutes} minutes. Number sequence starting at 1 in teaching order.`,
    });
  }

  async generateAssessments(
    context: AICurriculumContext,
    options?: AIGenerationOptions,
  ): Promise<AssessmentsSuggestion> {
    const count = options?.count ?? 3;
    return this.callTool({
      schema: AssessmentsSuggestionSchema,
      toolName: "return_assessments",
      toolDescription: "Return the suggested assessment items.",
      maxTokens: 1024,
      userPrompt: `${formatContextBlock(context)}

Suggest ${count} assessment items for checking learning against the Learning Indicator above.
Cover a mix of Depth of Knowledge (DoK) levels appropriate to the class level — do not make every
item the same DoK level unless that's genuinely the best fit. Number sequence starting at 1.`,
    });
  }

  async generateClosure(context: AICurriculumContext): Promise<ClosureSuggestion> {
    return this.callTool({
      schema: ClosureSuggestionSchema,
      toolName: "return_closure",
      toolDescription: "Return the suggested lesson closure.",
      maxTokens: 768,
      userPrompt: `${formatContextBlock(context)}

Suggest a single Lesson Closure activity: a short wrap-up (summary, quick recap questions, or a
preview of the next lesson) proportionate to the ${context.durationMinutes}-minute lesson —
typically 5-10 minutes. stage must be "CLOSURE" and sequence must be 1.`,
    });
  }

  async generateFullLessonDraft(context: AICurriculumContext): Promise<FullLessonDraftSuggestion> {
    return this.callTool({
      schema: FullLessonDraftSuggestionSchema,
      toolName: "return_full_lesson_draft",
      toolDescription: "Return the complete suggested lesson draft.",
      maxTokens: 4096,
      userPrompt: `${formatContextBlock(context)}

Produce one coherent lesson draft covering: essential questions, pedagogical strategies, a full
7-field differentiation plan, the complete lesson flow (Starter through Activity/Assessment
stages AND a final CLOSURE-stage row, all in one sequenced list, summing to approximately
${context.durationMinutes} minutes), and assessment items across a sensible mix of DoK levels.
Make sure every part is consistent with the others (e.g. activities should support the essential
questions and assessments should check the same content the activities taught).`,
    });
  }

  // --- Internals -----------------------------------------------------------

  private async callTool<T>(request: {
    schema: ZodType<T>;
    toolName: string;
    toolDescription: string;
    userPrompt: string;
    maxTokens: number;
  }): Promise<T> {
    if (!this.client) {
      throw new AIUnavailableError(this.getStatusMessage(), { category: "AI_CONFIGURATION_ERROR" });
    }

    const { $schema: _drop, ...inputSchema } = z.toJSONSchema(request.schema) as Record<
      string,
      unknown
    >;
    stripUnsupportedJsonSchemaKeywords(inputSchema);

    let response: Anthropic.Message;
    try {
      response = await this.client.messages.create({
        model: this.model,
        max_tokens: request.maxTokens,
        // No `temperature`: this model rejects it ("`temperature` is
        // deprecated for this model"), and output determinism is already
        // enforced by the forced tool-choice + strict schema below, not by
        // sampling — dropping it entirely rather than hardcoding a
        // model-specific parameter avoids reintroducing the same failure
        // if the configured model changes again via ANTHROPIC_MODEL.
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: request.userPrompt }],
        tools: [
          {
            name: request.toolName,
            description: request.toolDescription,
            input_schema: inputSchema as Anthropic.Tool.InputSchema,
            strict: true,
          },
        ],
        tool_choice: { type: "tool", name: request.toolName },
      });
    } catch (error) {
      throw mapAnthropicError(error);
    }

    if (response.stop_reason === "refusal") {
      throw new AIInvalidOutputError("The AI provider declined to generate a suggestion for this request.");
    }

    const toolUse = response.content.find(
      (block): block is Anthropic.ToolUseBlock =>
        block.type === "tool_use" && block.name === request.toolName,
    );
    if (!toolUse) {
      throw new AIInvalidOutputError(
        `The AI response did not include the expected "${request.toolName}" result (stop_reason: ${response.stop_reason ?? "unknown"}).`,
      );
    }

    const parsed = request.schema.safeParse(toolUse.input);
    if (!parsed.success) {
      throw new AIInvalidOutputError("The AI response did not match the expected shape.", {
        cause: parsed.error,
      });
    }
    return parsed.data;
  }
}

const DEFAULT_MODEL = "claude-sonnet-5";
const REQUEST_TIMEOUT_MS = 60_000;

const SYSTEM_PROMPT = `You help a Ghanaian basic/JHS/SHS teacher plan a single lesson.

You are given read-only curriculum context (subject, class, strand, sub-strand, content
standard, learning outcome, learning indicator, and lesson duration) pulled directly from the
school's official curriculum database.

Rules you must follow without exception:
- Treat the curriculum context as fixed and authoritative. Never invent, rename, renumber, or
  alter any curriculum standard, strand, sub-strand, content standard, learning outcome, or
  learning indicator. You are not producing curriculum data — only lesson-planning content that
  supports the curriculum context you were given.
- Respond ONLY by calling the one tool you are given, with arguments matching its schema exactly.
  Do not add any other commentary before or after the tool call.
- Everything you produce is a SUGGESTION for the teacher to review, edit, or discard before it is
  saved anywhere — write it as ready-to-use lesson content, but do not claim final authority.
- Keep content realistic and age-appropriate for the stated class level, and proportionate to the
  stated lesson duration.
- Write in clear, plain English suitable for a Ghanaian classroom context.
- You may also be given the teacher's own post-lesson reflection from an earlier lesson, included
  only because the teacher explicitly chose to share it as background. Treat it as informational —
  use it to avoid repeating something that didn't work, to reinforce reteaching needs, or to carry
  forward a planned change, but it describes a DIFFERENT, already-taught lesson: never treat it as
  an instruction to edit, and don't assume its content applies verbatim to this new lesson.`;

/**
 * Anthropic's `strict: true` tool `input_schema` accepts only a subset of
 * JSON Schema — it rejects bound keywords `z.toJSONSchema()` emits for
 * ordinary Zod `.min()`/`.max()` constraints:
 *   - `maxItems`/`minItems` on an array node ("For 'array' type, property
 *     'maxItems' is not supported"), from e.g. `z.array(...).max(20)`.
 *   - `maximum`/`minimum` on a number/integer node ("For 'integer' type,
 *     properties maximum, minimum are not supported"), from e.g.
 *     `z.number().int().min(1).max(300)` (see `LessonActivityInputSchema`,
 *     `AssessmentInputSchema` in `lib/validation/planner.schema.ts`).
 * Stripping these from the REQUEST schema only fixes the incompatibility
 * without weakening validation: the original Zod schema (bounds intact) is
 * still what `request.schema.safeParse(toolUse.input)` checks the
 * RESPONSE against, a few lines below — this only affects what we tell
 * Anthropic to constrain on the way in.
 */
function stripUnsupportedJsonSchemaKeywords(node: unknown): void {
  if (Array.isArray(node)) {
    for (const item of node) stripUnsupportedJsonSchemaKeywords(item);
    return;
  }
  if (node && typeof node === "object") {
    const obj = node as Record<string, unknown>;
    delete obj.maxItems;
    delete obj.minItems;
    delete obj.maximum;
    delete obj.minimum;
    delete obj.exclusiveMaximum;
    delete obj.exclusiveMinimum;
    for (const value of Object.values(obj)) stripUnsupportedJsonSchemaKeywords(value);
  }
}

function formatContextBlock(context: AICurriculumContext): string {
  const base = `Curriculum context (read-only, from the official curriculum database — do not alter):
- Subject: ${context.subject}
- Class: ${context.classLevel}
- Strand: ${context.strand}
- Sub-Strand: ${context.subStrand}
- Content Standard: ${context.contentStandard}
- Learning Outcome: ${context.learningOutcome}
- Learning Indicator: ${context.learningIndicator}
- Lesson Duration: ${context.durationMinutes} minutes`;

  if (!context.previousLessonReflection) return base;

  return `${base}

The teacher has opted to share their reflection on a previous lesson as background context:
"""
${context.previousLessonReflection}
"""`;
}

/** Maps the SDK's error hierarchy onto our own AppError subclasses — nothing raw crosses this boundary. */
function mapAnthropicError(error: unknown): AppError {
  if (error instanceof Anthropic.APIConnectionTimeoutError) {
    return new AITimeoutError("The AI provider took too long to respond.", { cause: error });
  }
  if (error instanceof Anthropic.APIConnectionError) {
    return new AIRequestError("Could not reach the AI provider (network error).", {
      cause: error,
      category: "AI_NETWORK_ERROR",
    });
  }
  if (error instanceof Anthropic.RateLimitError) {
    return new AIRateLimitError("The AI provider is rate-limited. Please try again shortly.", {
      cause: error,
    });
  }
  if (error instanceof Anthropic.AuthenticationError) {
    return new AIUnavailableError(
      "The AI provider rejected the configured API key. Check ANTHROPIC_API_KEY.",
      { cause: error, category: "AI_AUTHENTICATION_ERROR" },
    );
  }
  if (error instanceof Anthropic.APIError) {
    return new AIRequestError(`The AI provider returned an error (HTTP ${error.status ?? "?"}).`, {
      cause: error,
    });
  }
  return new AIRequestError("Unexpected error calling the AI provider.", { cause: error });
}

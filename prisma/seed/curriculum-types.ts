/**
 * Re-exports the canonical curriculum tree input shape from the app's
 * curriculum-import service so seed scripts and the admin import feature
 * share one definition. See src/server/services/curriculum-import/types.ts.
 */
export type {
  CurriculumTreeInput,
  StrandInput,
  SubStrandInput,
  ContentStandardInput,
  LearningOutcomeInput,
  LearningIndicatorInput,
} from "../../src/server/services/curriculum-import/types";

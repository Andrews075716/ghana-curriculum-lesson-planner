import { z } from "zod";

/**
 * Validated environment variables. Import `env` instead of reading
 * `process.env` directly so misconfiguration fails fast and loudly.
 */
const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  // AI provider abstraction (server/ai) — see .env.example.
  AI_PROVIDER: z.enum(["none", "anthropic"]).default("none"),
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().optional(),

  // Auth — see .env.example.
  SESSION_SECRET: z.string().min(1, "SESSION_SECRET is required"),
  EMAIL_PROVIDER: z.enum(["console"]).default("console"),
});

export type Env = z.infer<typeof envSchema>;

export const env: Env = envSchema.parse(process.env);

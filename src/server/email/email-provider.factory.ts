import type { EmailProvider } from "./email-provider.interface";

/**
 * Resolves the configured `EmailProvider` from `env.EMAIL_PROVIDER`.
 * "console" (the default) logs instead of sending — see
 * `ConsoleEmailProvider`. Adding a real provider later means adding a
 * `providers/<name>-email-provider.ts` and a case below.
 */
export async function getEmailProvider(): Promise<EmailProvider> {
  const configured = process.env.EMAIL_PROVIDER?.trim().toLowerCase() || "console";

  switch (configured) {
    case "console":
    default: {
      const { ConsoleEmailProvider } = await import("./providers/console-email-provider");
      return new ConsoleEmailProvider();
    }
  }
}

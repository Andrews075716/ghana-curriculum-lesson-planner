export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
}

/**
 * Provider-agnostic contract for outbound transactional email (currently:
 * password-reset links only). Mirrors the shape of `server/ai`'s provider
 * abstraction for the same reason — swapping in a real provider (Resend,
 * SES, Postmark, ...) later should mean adding one
 * `providers/<name>-email-provider.ts` file, never touching the
 * auth service that calls `send()`.
 */
export interface EmailProvider {
  readonly name: string;
  isEnabled(): boolean;
  send(message: EmailMessage): Promise<void>;
}

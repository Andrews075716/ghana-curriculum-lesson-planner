import type { EmailMessage, EmailProvider } from "../email-provider.interface";

/**
 * Default provider while no real email service is configured
 * (`EMAIL_PROVIDER=console`, the default — see .env.example). Writes the
 * message to the server log instead of sending it, so the
 * forgot/reset-password flow is fully testable in local dev without SMTP
 * credentials: the reset link is right there in the terminal.
 */
export class ConsoleEmailProvider implements EmailProvider {
  readonly name = "console";

  isEnabled(): boolean {
    return true;
  }

  async send(message: EmailMessage): Promise<void> {
    console.log(
      `\n[email:console] To: ${message.to}\nSubject: ${message.subject}\n${message.text}\n`,
    );
  }
}

/**
 * Provedor de email plugável. No MVP usamos ConsoleEmailProvider
 * (loga no terminal). Trocar por Resend/Brevo na Fase 10 é só
 * instanciar outra implementação aqui.
 */

export interface EmailMessage {
  to: string;
  subject: string;
  body: string;
}

export interface EmailProvider {
  send(message: EmailMessage): Promise<void>;
}

class ConsoleEmailProvider implements EmailProvider {
  async send(message: EmailMessage): Promise<void> {
    console.log("\n[email] ========== EMAIL SIMULADO ==========");
    console.log(`[email] Para:    ${message.to}`);
    console.log(`[email] Assunto: ${message.subject}`);
    console.log("[email] Corpo:");
    console.log(message.body);
    console.log("[email] =====================================\n");
  }
}

export const emailProvider: EmailProvider = new ConsoleEmailProvider();

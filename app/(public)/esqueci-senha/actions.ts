"use server";

import crypto from "node:crypto";

import { writeAuditLog } from "@/lib/audit";
import { db } from "@/lib/db";
import { emailProvider } from "@/lib/email";
import { forgotPasswordSchema } from "@/lib/validators/auth";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hora

const GENERIC_RESPONSE = {
  ok: true as const,
  message:
    "Se este email estiver cadastrado, enviaremos um link de recuperação em instantes.",
};

export async function requestPasswordReset(formData: FormData) {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    // Mantém anti-enumeração mesmo se o input está malformado — não revela.
    return GENERIC_RESPONSE;
  }

  const email = parsed.data.email.toLowerCase().trim();
  const user = await db.user.findUnique({ where: { email } });

  if (user && user.active) {
    const tokenRaw = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(tokenRaw).digest("hex");

    await db.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
      },
    });

    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const url = `${baseUrl}/redefinir-senha/${tokenRaw}`;

    await emailProvider.send({
      to: user.email,
      subject: "Recuperação de senha — Plataforma de Treinamentos",
      body:
        `Olá ${user.name},\n\n` +
        `Recebemos uma solicitação para redefinir a sua senha.\n` +
        `Acesse o link abaixo (válido por 1 hora):\n\n` +
        `${url}\n\n` +
        `Se você não solicitou, ignore este email.`,
    });

    await writeAuditLog({
      userId: user.id,
      action: "PASSWORD_RESET_REQUEST",
      entity: "User",
      entityId: user.id,
    });
  }

  return GENERIC_RESPONSE;
}

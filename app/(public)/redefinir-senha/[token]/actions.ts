"use server";

import crypto from "node:crypto";

import { writeAuditLog } from "@/lib/audit";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { resetPasswordSchema } from "@/lib/validators/auth";

type ResetResult =
  | { ok: true }
  | { ok: false; message: string };

export async function resetPassword(
  token: string,
  password: string,
  confirmPassword: string,
): Promise<ResetResult> {
  const parsed = resetPasswordSchema.safeParse({ password, confirmPassword });
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Senha inválida.",
    };
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const record = await db.passwordResetToken.findUnique({
    where: { tokenHash },
  });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return { ok: false, message: "Link inválido ou expirado. Solicite um novo." };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const now = new Date();

  await db.$transaction([
    db.user.update({
      where: { id: record.userId },
      data: {
        passwordHash,
        passwordChangedAt: now,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    }),
    db.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: now },
    }),
  ]);

  await writeAuditLog({
    userId: record.userId,
    action: "PASSWORD_RESET_COMPLETE",
    entity: "User",
    entityId: record.userId,
  });

  return { ok: true };
}

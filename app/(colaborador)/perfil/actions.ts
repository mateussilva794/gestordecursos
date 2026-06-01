"use server";

import { revalidatePath } from "next/cache";

import { writeAuditLog } from "@/lib/audit";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/guards";
import { hashPassword, verifyPassword } from "@/lib/password";
import {
  changePasswordSchema,
  profileSchema,
} from "@/lib/validators/profile";

type Result = { ok: true } | { ok: false; message: string };

export async function updateProfile(input: unknown): Promise<Result> {
  const user = await requireSession();
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  await db.user.update({
    where: { id: user.id },
    data: { name: parsed.data.name },
  });

  await writeAuditLog({
    userId: user.id,
    action: "PROFILE_UPDATE",
    entity: "User",
    entityId: user.id,
  });

  revalidatePath("/perfil");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function changePassword(input: unknown): Promise<Result> {
  const user = await requireSession();
  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const dbUser = await db.user.findUniqueOrThrow({ where: { id: user.id } });
  const valid = await verifyPassword(
    parsed.data.currentPassword,
    dbUser.passwordHash,
  );
  if (!valid) {
    return { ok: false, message: "Senha atual incorreta." };
  }

  const newHash = await hashPassword(parsed.data.newPassword);
  await db.user.update({
    where: { id: user.id },
    data: {
      passwordHash: newHash,
      passwordChangedAt: new Date(),
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  });

  await writeAuditLog({
    userId: user.id,
    action: "PASSWORD_CHANGE",
    entity: "User",
    entityId: user.id,
  });

  return { ok: true };
}

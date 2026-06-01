"use server";

import crypto from "node:crypto";

import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { writeAuditLog } from "@/lib/audit";
import { isValidCpf, onlyDigits } from "@/lib/cpf";
import { parseCsv } from "@/lib/csv";
import { db } from "@/lib/db";
import { emailProvider } from "@/lib/email";
import { requireRole } from "@/lib/guards";
import { hashPassword } from "@/lib/password";
import { userCreateSchema, userUpdateSchema } from "@/lib/validators/user";

const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

async function generateInvitationLink(userId: string): Promise<string> {
  const tokenRaw = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(tokenRaw).digest("hex");
  await db.passwordResetToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt: new Date(Date.now() + INVITATION_TTL_MS),
    },
  });
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  return `${baseUrl}/redefinir-senha/${tokenRaw}`;
}

async function sendInvitationEmail(
  name: string,
  email: string,
  link: string,
): Promise<void> {
  await emailProvider.send({
    to: email,
    subject: "Convite — Plataforma de Treinamentos",
    body:
      `Olá ${name},\n\n` +
      `Sua conta na plataforma interna de treinamentos foi criada.\n` +
      `Defina sua senha através do link abaixo (válido por 7 dias):\n\n` +
      `${link}\n\n` +
      `Após definir a senha, faça login com seu email: ${email}`,
  });
}

async function generateRandomPasswordHash(): Promise<string> {
  // Hash de uma senha aleatória e descartável — usuário define a real
  // através do link de convite (PasswordResetToken).
  const random = crypto.randomBytes(32).toString("hex");
  return hashPassword(random);
}

type UserActionResult =
  | { ok: true; id: string }
  | { ok: false; message: string };

export async function createUser(input: unknown): Promise<UserActionResult> {
  const actor = await requireRole("ADMIN");
  const parsed = userCreateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }
  const data = parsed.data;
  const email = data.email.toLowerCase();
  const cpf = data.cpf ? onlyDigits(data.cpf) || null : null;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return { ok: false, message: "Já existe um usuário com este email." };
  }
  if (cpf) {
    const existingCpf = await db.user.findUnique({ where: { cpf } });
    if (existingCpf) {
      return { ok: false, message: "Já existe um usuário com este CPF." };
    }
  }

  const passwordHash = await generateRandomPasswordHash();

  const user = await db.user.create({
    data: {
      name: data.name,
      email,
      role: data.role,
      department: data.department?.trim() || null,
      position: data.position?.trim() || null,
      cpf,
      passwordHash,
    },
  });

  const link = await generateInvitationLink(user.id);
  await sendInvitationEmail(user.name, user.email, link);

  await writeAuditLog({
    userId: actor.id,
    action: "USER_CREATE",
    entity: "User",
    entityId: user.id,
    metadata: { email: user.email, role: user.role },
  });

  revalidatePath("/admin/usuarios");
  return { ok: true, id: user.id };
}

export async function updateUser(
  id: string,
  input: unknown,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const actor = await requireRole("ADMIN");
  const parsed = userUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }
  const data = parsed.data;
  const email = data.email.toLowerCase();
  const cpf = data.cpf ? onlyDigits(data.cpf) || null : null;

  if (actor.id === id) {
    const me = await db.user.findUniqueOrThrow({ where: { id } });
    if (data.role !== me.role) {
      return {
        ok: false,
        message: "Você não pode alterar seu próprio papel.",
      };
    }
    if (!data.active) {
      return {
        ok: false,
        message: "Você não pode desativar sua própria conta.",
      };
    }
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (existing && existing.id !== id) {
    return { ok: false, message: "Já existe um usuário com este email." };
  }
  if (cpf) {
    const existingCpf = await db.user.findUnique({ where: { cpf } });
    if (existingCpf && existingCpf.id !== id) {
      return { ok: false, message: "Já existe um usuário com este CPF." };
    }
  }

  await db.user.update({
    where: { id },
    data: {
      name: data.name,
      email,
      role: data.role,
      department: data.department?.trim() || null,
      position: data.position?.trim() || null,
      cpf,
      active: data.active,
    },
  });

  await writeAuditLog({
    userId: actor.id,
    action: "USER_UPDATE",
    entity: "User",
    entityId: id,
    metadata: { email, role: data.role, active: data.active },
  });

  revalidatePath("/admin/usuarios");
  revalidatePath(`/admin/usuarios/${id}/editar`);
  return { ok: true };
}

function isAnonymizedEmail(email: string): boolean {
  return email.startsWith("anon-") && email.endsWith("@deleted.local");
}

export async function anonymizeUser(
  id: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const actor = await requireRole("ADMIN");
  if (actor.id === id) {
    return {
      ok: false,
      message: "Você não pode anonimizar a própria conta.",
    };
  }
  const user = await db.user.findUnique({ where: { id } });
  if (!user) {
    return { ok: false, message: "Usuário não encontrado." };
  }
  if (isAnonymizedEmail(user.email)) {
    return { ok: false, message: "Usuário já está anonimizado." };
  }

  const suffix = crypto.randomBytes(6).toString("hex");
  const originalEmail = user.email;

  await db.$transaction([
    db.user.update({
      where: { id },
      data: {
        name: "Usuário removido",
        email: `anon-${suffix}@deleted.local`,
        cpf: null,
        photoUrl: null,
        active: false,
        // Invalida tokens de sessão emitidos antes desta operação.
        passwordChangedAt: new Date(),
      },
    }),
    db.passwordResetToken.deleteMany({ where: { userId: id } }),
  ]);

  await writeAuditLog({
    userId: actor.id,
    action: "DELETE_USER_DATA",
    entity: "User",
    entityId: id,
    metadata: { method: "anonymize", originalEmail },
  });

  revalidatePath("/admin/usuarios");
  revalidatePath(`/admin/usuarios/${id}/editar`);
  revalidatePath(`/admin/usuarios/${id}/lgpd`);
  return { ok: true };
}

export async function toggleUserActive(
  id: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const actor = await requireRole("ADMIN");
  if (actor.id === id) {
    return {
      ok: false,
      message: "Você não pode desativar sua própria conta.",
    };
  }
  const current = await db.user.findUniqueOrThrow({
    where: { id },
    select: { active: true },
  });
  await db.user.update({
    where: { id },
    data: { active: !current.active },
  });
  await writeAuditLog({
    userId: actor.id,
    action: "USER_TOGGLE_ACTIVE",
    entity: "User",
    entityId: id,
    metadata: { newState: !current.active },
  });
  revalidatePath("/admin/usuarios");
  return { ok: true };
}

export async function resendInvitation(
  id: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const actor = await requireRole("ADMIN");
  const user = await db.user.findUniqueOrThrow({ where: { id } });
  if (!user.active) {
    return {
      ok: false,
      message: "Usuário inativo. Reative antes de reenviar o convite.",
    };
  }
  const link = await generateInvitationLink(user.id);
  await sendInvitationEmail(user.name, user.email, link);
  await writeAuditLog({
    userId: actor.id,
    action: "USER_INVITATION_RESEND",
    entity: "User",
    entityId: user.id,
  });
  return { ok: true };
}

type CsvImportResult =
  | {
      ok: true;
      created: number;
      skipped: number;
      errors: { line: number; reason: string }[];
    }
  | { ok: false; message: string };

export async function importUsersFromCsv(
  csvText: string,
): Promise<CsvImportResult> {
  const actor = await requireRole("ADMIN");
  const { header, rows } = parseCsv(csvText);

  if (header.length === 0 || rows.length === 0) {
    return { ok: false, message: "CSV vazio ou sem header." };
  }

  const normalized = header.map((h) => h.toLowerCase());
  const idxName = normalized.indexOf("name");
  const idxEmail = normalized.indexOf("email");
  if (idxName < 0 || idxEmail < 0) {
    return {
      ok: false,
      message: 'Colunas obrigatórias ausentes: "name" e "email".',
    };
  }
  const idxDept = normalized.indexOf("department");
  const idxPos = normalized.indexOf("position");
  const idxRole = normalized.indexOf("role");
  const idxCpf = normalized.indexOf("cpf");

  const errors: { line: number; reason: string }[] = [];
  let created = 0;
  let skipped = 0;

  for (let i = 0; i < rows.length; i++) {
    const cells = rows[i]!;
    const lineNumber = i + 2; // header é linha 1

    const name = (cells[idxName] ?? "").trim();
    const email = (cells[idxEmail] ?? "").trim().toLowerCase();
    const department =
      idxDept >= 0 ? (cells[idxDept] ?? "").trim() || null : null;
    const position =
      idxPos >= 0 ? (cells[idxPos] ?? "").trim() || null : null;
    const roleRaw =
      idxRole >= 0 ? (cells[idxRole] ?? "").trim().toUpperCase() : "";
    const role: Role = roleRaw === "" ? Role.COLABORADOR : (roleRaw as Role);
    const cpfRaw = idxCpf >= 0 ? (cells[idxCpf] ?? "").trim() : "";

    if (!name || !email) {
      errors.push({ line: lineNumber, reason: "name e email obrigatórios." });
      continue;
    }
    if (!Object.values(Role).includes(role)) {
      errors.push({
        line: lineNumber,
        reason: `Papel inválido: "${roleRaw}". Use COLABORADOR, RH ou ADMIN.`,
      });
      continue;
    }

    let cpf: string | null = null;
    if (cpfRaw) {
      const digits = onlyDigits(cpfRaw);
      if (!isValidCpf(digits)) {
        errors.push({ line: lineNumber, reason: `CPF inválido: ${cpfRaw}` });
        continue;
      }
      cpf = digits;
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      skipped++;
      continue;
    }
    if (cpf) {
      const existingCpf = await db.user.findUnique({ where: { cpf } });
      if (existingCpf) {
        errors.push({
          line: lineNumber,
          reason: `CPF já cadastrado para outro usuário.`,
        });
        continue;
      }
    }

    const passwordHash = await generateRandomPasswordHash();
    const user = await db.user.create({
      data: {
        name,
        email,
        role,
        department,
        position,
        cpf,
        passwordHash,
      },
    });

    try {
      const link = await generateInvitationLink(user.id);
      await sendInvitationEmail(user.name, user.email, link);
    } catch (e) {
      // Convite falhou mas o usuário foi criado — registra mas não bloqueia o lote.
      errors.push({
        line: lineNumber,
        reason: `Usuário criado, mas envio de convite falhou: ${(e as Error).message}`,
      });
    }
    created++;
  }

  await writeAuditLog({
    userId: actor.id,
    action: "USER_CSV_IMPORT",
    metadata: { created, skipped, errors: errors.length, totalRows: rows.length },
  });

  revalidatePath("/admin/usuarios");
  return { ok: true, created, skipped, errors };
}

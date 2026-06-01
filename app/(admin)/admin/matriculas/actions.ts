"use server";

import { type Prisma, type Role } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { writeAuditLog } from "@/lib/audit";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/guards";
import { bulkEnrollSchema } from "@/lib/validators/enrollment";

type BulkPreviewResult =
  | {
      ok: true;
      userCount: number;
      courseCount: number;
      totalPotential: number;
      existingCount: number;
      newEnrollments: number;
    }
  | { ok: false; message: string };

function buildUserFilter(
  filterRole: "COLABORADOR" | "RH" | "ADMIN" | "ALL",
  filterDepartment: string | null | undefined,
  onlyActive: boolean,
): Prisma.UserWhereInput {
  const where: Prisma.UserWhereInput = {};
  if (filterRole !== "ALL") where.role = filterRole as Role;
  if (filterDepartment && filterDepartment.trim() !== "") {
    where.department = filterDepartment.trim();
  }
  if (onlyActive) where.active = true;
  return where;
}

export async function previewBulkEnrollment(
  input: unknown,
): Promise<BulkPreviewResult> {
  await requireRole("RH");
  const parsed = bulkEnrollSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }
  const { courseIds, filterRole, filterDepartment, onlyActive } = parsed.data;
  const userFilter = buildUserFilter(
    filterRole,
    filterDepartment,
    onlyActive,
  );

  const userCount = await db.user.count({ where: userFilter });
  const existingCount = await db.courseEnrollment.count({
    where: { courseId: { in: courseIds }, user: userFilter },
  });
  const totalPotential = userCount * courseIds.length;
  const newEnrollments = Math.max(0, totalPotential - existingCount);

  return {
    ok: true,
    userCount,
    courseCount: courseIds.length,
    totalPotential,
    existingCount,
    newEnrollments,
  };
}

type BulkApplyResult =
  | { ok: true; created: number; skipped: number }
  | { ok: false; message: string };

export async function bulkEnrollUsers(
  input: unknown,
): Promise<BulkApplyResult> {
  const actor = await requireRole("RH");
  const parsed = bulkEnrollSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }
  const { courseIds, filterRole, filterDepartment, onlyActive } = parsed.data;
  const userFilter = buildUserFilter(
    filterRole,
    filterDepartment,
    onlyActive,
  );

  const [users, courses] = await Promise.all([
    db.user.findMany({ where: userFilter, select: { id: true } }),
    db.course.findMany({
      where: { id: { in: courseIds } },
      select: { id: true, maxAttempts: true },
    }),
  ]);

  let created = 0;
  let skipped = 0;

  for (const u of users) {
    for (const c of courses) {
      const existing = await db.courseEnrollment.findUnique({
        where: { userId_courseId: { userId: u.id, courseId: c.id } },
        select: { id: true },
      });
      if (existing) {
        skipped++;
        continue;
      }
      await db.courseEnrollment.create({
        data: {
          userId: u.id,
          courseId: c.id,
          status: "NOT_STARTED",
          attemptsAllowed: c.maxAttempts,
          assignedById: actor.id,
        },
      });
      created++;
    }
  }

  await writeAuditLog({
    userId: actor.id,
    action: "ENROLLMENT_BULK_CREATE",
    metadata: {
      userCount: users.length,
      courseCount: courses.length,
      created,
      skipped,
      filterRole,
      filterDepartment,
      onlyActive,
    },
  });

  revalidatePath("/admin/matriculas");
  return { ok: true, created, skipped };
}

type SimpleResult = { ok: true } | { ok: false; message: string };

export async function enrollSingleUser(
  userId: string,
  courseId: string,
): Promise<SimpleResult> {
  const actor = await requireRole("RH");
  const course = await db.course.findUnique({
    where: { id: courseId },
    select: { id: true, maxAttempts: true, active: true },
  });
  if (!course) return { ok: false, message: "Curso não encontrado." };

  const existing = await db.courseEnrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
    select: { id: true },
  });
  if (existing) {
    return { ok: false, message: "Usuário já matriculado neste curso." };
  }

  await db.courseEnrollment.create({
    data: {
      userId,
      courseId,
      status: "NOT_STARTED",
      attemptsAllowed: course.maxAttempts,
      assignedById: actor.id,
    },
  });

  await writeAuditLog({
    userId: actor.id,
    action: "ENROLLMENT_CREATE",
    entity: "CourseEnrollment",
    metadata: { userId, courseId },
  });

  revalidatePath(`/admin/usuarios/${userId}/matriculas`);
  return { ok: true };
}

export async function unenrollUser(
  userId: string,
  courseId: string,
): Promise<SimpleResult> {
  const actor = await requireRole("RH");
  const attemptsCount = await db.quizAttempt.count({
    where: { enrollment: { userId, courseId } },
  });
  if (attemptsCount > 0) {
    return {
      ok: false,
      message:
        "Esta matrícula já tem tentativas registradas — não pode ser removida (histórico). Desative o curso se necessário.",
    };
  }

  await db.courseEnrollment.delete({
    where: { userId_courseId: { userId, courseId } },
  });

  await writeAuditLog({
    userId: actor.id,
    action: "ENROLLMENT_DELETE",
    entity: "CourseEnrollment",
    metadata: { userId, courseId },
  });

  revalidatePath(`/admin/usuarios/${userId}/matriculas`);
  return { ok: true };
}

export async function grantExtraAttempt(
  userId: string,
  courseId: string,
): Promise<SimpleResult> {
  const actor = await requireRole("RH");
  const enrollment = await db.courseEnrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });
  if (!enrollment) {
    return { ok: false, message: "Matrícula não encontrada." };
  }

  await db.courseEnrollment.update({
    where: { id: enrollment.id },
    data: {
      attemptsAllowed: enrollment.attemptsAllowed + 1,
      status:
        enrollment.status === "BLOCKED"
          ? "IN_PROGRESS"
          : enrollment.status,
    },
  });

  await writeAuditLog({
    userId: actor.id,
    action: "ENROLLMENT_GRANT_ATTEMPT",
    entity: "CourseEnrollment",
    entityId: enrollment.id,
    metadata: {
      userId,
      courseId,
      newAttemptsAllowed: enrollment.attemptsAllowed + 1,
    },
  });

  revalidatePath(`/admin/usuarios/${userId}/matriculas`);
  return { ok: true };
}

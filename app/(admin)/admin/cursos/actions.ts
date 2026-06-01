"use server";

import { revalidatePath } from "next/cache";

import { writeAuditLog } from "@/lib/audit";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/guards";
import { courseSchema } from "@/lib/validators/course";

type CourseActionResult =
  | { ok: true; id: string }
  | { ok: false; message: string };

function normalizeCategory(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export async function createCourse(input: unknown): Promise<CourseActionResult> {
  const user = await requireRole("RH");
  const parsed = courseSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const data = parsed.data;
  const course = await db.course.create({
    data: {
      title: data.title,
      description: data.description,
      category: normalizeCategory(data.category),
      workloadHours: data.workloadHours,
      externalUrl: data.externalUrl,
      passingScore: data.passingScore,
      maxAttempts: data.maxAttempts,
      active: data.active,
      createdById: user.id,
    },
  });

  await writeAuditLog({
    userId: user.id,
    action: "COURSE_CREATE",
    entity: "Course",
    entityId: course.id,
  });

  revalidatePath("/admin/cursos");
  return { ok: true, id: course.id };
}

export async function updateCourse(
  id: string,
  input: unknown,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const user = await requireRole("RH");
  const parsed = courseSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const data = parsed.data;
  await db.course.update({
    where: { id },
    data: {
      title: data.title,
      description: data.description,
      category: normalizeCategory(data.category),
      workloadHours: data.workloadHours,
      externalUrl: data.externalUrl,
      passingScore: data.passingScore,
      maxAttempts: data.maxAttempts,
      active: data.active,
    },
  });

  await writeAuditLog({
    userId: user.id,
    action: "COURSE_UPDATE",
    entity: "Course",
    entityId: id,
  });

  revalidatePath("/admin/cursos");
  revalidatePath(`/admin/cursos/${id}/editar`);
  return { ok: true };
}

export async function toggleCourseActive(id: string): Promise<void> {
  const user = await requireRole("RH");
  const current = await db.course.findUniqueOrThrow({
    where: { id },
    select: { active: true },
  });
  await db.course.update({
    where: { id },
    data: { active: !current.active },
  });
  await writeAuditLog({
    userId: user.id,
    action: "COURSE_TOGGLE_ACTIVE",
    entity: "Course",
    entityId: id,
    metadata: { newState: !current.active },
  });
  revalidatePath("/admin/cursos");
}

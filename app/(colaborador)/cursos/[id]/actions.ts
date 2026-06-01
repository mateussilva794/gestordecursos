"use server";

import { revalidatePath } from "next/cache";

import { writeAuditLog } from "@/lib/audit";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/guards";

type Result =
  | { ok: true }
  | { ok: false; message: string };

export async function markAsWatched(courseId: string): Promise<Result> {
  const user = await requireSession();
  const enrollment = await db.courseEnrollment.findUnique({
    where: { userId_courseId: { userId: user.id, courseId } },
  });
  if (!enrollment) {
    return { ok: false, message: "Você não está matriculado neste curso." };
  }
  if (enrollment.watchedAt) {
    // Idempotente — já marcado, não duplica audit.
    return { ok: true };
  }

  const now = new Date();
  await db.courseEnrollment.update({
    where: { id: enrollment.id },
    data: {
      watchedAt: now,
      startedAt: enrollment.startedAt ?? now,
      status:
        enrollment.status === "NOT_STARTED"
          ? "IN_PROGRESS"
          : enrollment.status,
    },
  });

  await writeAuditLog({
    userId: user.id,
    action: "ENROLLMENT_MARK_WATCHED",
    entity: "CourseEnrollment",
    entityId: enrollment.id,
    metadata: { courseId },
  });

  revalidatePath(`/cursos/${courseId}`);
  revalidatePath("/dashboard");
  return { ok: true };
}

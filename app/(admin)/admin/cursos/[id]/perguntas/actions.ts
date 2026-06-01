"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { writeAuditLog } from "@/lib/audit";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/guards";
import { questionSchema } from "@/lib/validators/course";

type Result =
  | { ok: true; id?: string }
  | { ok: false; message: string };

export async function createQuestion(
  courseId: string,
  input: unknown,
): Promise<Result> {
  const user = await requireRole("RH");
  const parsed = questionSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }
  const data = parsed.data;

  const question = await db.$transaction(async (tx) => {
    const q = await tx.question.create({
      data: { courseId, statement: data.statement, order: data.order },
    });
    await tx.answer.createMany({
      data: data.answers.map((a, i) => ({
        questionId: q.id,
        text: a.text,
        isCorrect: a.isCorrect,
        order: i + 1,
      })),
    });
    return q;
  });

  await writeAuditLog({
    userId: user.id,
    action: "QUESTION_CREATE",
    entity: "Question",
    entityId: question.id,
    metadata: { courseId },
  });

  revalidatePath(`/admin/cursos/${courseId}/perguntas`);
  return { ok: true, id: question.id };
}

export async function updateQuestion(
  courseId: string,
  questionId: string,
  input: unknown,
): Promise<Result> {
  const user = await requireRole("RH");
  const parsed = questionSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }
  const data = parsed.data;

  await db.$transaction(async (tx) => {
    await tx.question.update({
      where: { id: questionId },
      data: { statement: data.statement, order: data.order },
    });
    // Substitui as alternativas. Snapshots em QuizResponse preservam
    // o que valeu para tentativas anteriores.
    await tx.answer.deleteMany({ where: { questionId } });
    await tx.answer.createMany({
      data: data.answers.map((a, i) => ({
        questionId,
        text: a.text,
        isCorrect: a.isCorrect,
        order: i + 1,
      })),
    });
  });

  await writeAuditLog({
    userId: user.id,
    action: "QUESTION_UPDATE",
    entity: "Question",
    entityId: questionId,
    metadata: { courseId },
  });

  revalidatePath(`/admin/cursos/${courseId}/perguntas`);
  return { ok: true };
}

export async function deleteQuestion(
  courseId: string,
  questionId: string,
): Promise<Result> {
  const user = await requireRole("RH");
  try {
    await db.question.delete({ where: { id: questionId } });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      // FK violation: QuizResponse referencia esta pergunta.
      return {
        ok: false,
        message:
          "Esta pergunta já tem respostas registradas em tentativas. Edite-a em vez de excluir.",
      };
    }
    throw error;
  }

  await writeAuditLog({
    userId: user.id,
    action: "QUESTION_DELETE",
    entity: "Question",
    entityId: questionId,
    metadata: { courseId },
  });

  revalidatePath(`/admin/cursos/${courseId}/perguntas`);
  return { ok: true };
}

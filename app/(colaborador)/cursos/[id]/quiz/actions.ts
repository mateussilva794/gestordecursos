"use server";

import { revalidatePath } from "next/cache";

import { writeAuditLog } from "@/lib/audit";
import { ensureCertificateForAttempt } from "@/lib/certificates";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/guards";
import { quizSubmitSchema } from "@/lib/validators/quiz";

type StartResult =
  | { ok: true; attemptId: string }
  | { ok: false; message: string };

export async function startQuizAttempt(
  courseId: string,
): Promise<StartResult> {
  const user = await requireSession();
  const enrollment = await db.courseEnrollment.findUnique({
    where: { userId_courseId: { userId: user.id, courseId } },
    include: { course: true, attempts: true },
  });
  if (!enrollment) {
    return { ok: false, message: "Você não está matriculado neste curso." };
  }
  if (!enrollment.watchedAt) {
    return { ok: false, message: "Marque o vídeo como assistido primeiro." };
  }
  if (!enrollment.course.active) {
    return { ok: false, message: "Curso desativado." };
  }
  if (enrollment.status === "COMPLETED") {
    return { ok: false, message: "Você já concluiu este curso." };
  }

  // Tentativa em aberto → retorna ela (continuar)
  const open = enrollment.attempts.find((a) => a.finishedAt === null);
  if (open) {
    return { ok: true, attemptId: open.id };
  }

  const finished = enrollment.attempts.filter((a) => a.finishedAt !== null);
  if (finished.length >= enrollment.attemptsAllowed) {
    return { ok: false, message: "Tentativas esgotadas." };
  }

  const attempt = await db.quizAttempt.create({
    data: {
      enrollmentId: enrollment.id,
      attemptNumber: enrollment.attempts.length + 1,
      score: 0,
      passed: false,
    },
  });

  if (enrollment.status === "NOT_STARTED") {
    await db.courseEnrollment.update({
      where: { id: enrollment.id },
      data: {
        status: "IN_PROGRESS",
        startedAt: enrollment.startedAt ?? new Date(),
      },
    });
  }

  await writeAuditLog({
    userId: user.id,
    action: "QUIZ_ATTEMPT_START",
    entity: "QuizAttempt",
    entityId: attempt.id,
    metadata: { courseId, attemptNumber: attempt.attemptNumber },
  });

  revalidatePath(`/cursos/${courseId}/quiz`);
  revalidatePath(`/cursos/${courseId}`);
  return { ok: true, attemptId: attempt.id };
}

type SubmitResult =
  | { ok: true; passed: boolean; score: number }
  | { ok: false; message: string };

export async function submitQuizAttempt(
  input: unknown,
): Promise<SubmitResult> {
  const user = await requireSession();
  const parsed = quizSubmitSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }
  const { attemptId, responses } = parsed.data;

  const attempt = await db.quizAttempt.findUnique({
    where: { id: attemptId },
    include: { enrollment: { include: { course: true } } },
  });
  if (!attempt) {
    return { ok: false, message: "Tentativa não encontrada." };
  }
  if (attempt.enrollment.userId !== user.id) {
    return { ok: false, message: "Sem permissão." };
  }
  if (attempt.finishedAt) {
    return { ok: false, message: "Esta tentativa já foi enviada." };
  }

  const courseId = attempt.enrollment.courseId;

  const questions = await db.question.findMany({
    where: { courseId },
    include: { answers: true },
  });

  const questionIds = new Set(questions.map((q) => q.id));
  const responseQuestionIds = new Set(responses.map((r) => r.questionId));
  if (
    responses.length !== questions.length ||
    responseQuestionIds.size !== questions.length
  ) {
    return {
      ok: false,
      message: "Responda todas as perguntas exatamente uma vez.",
    };
  }
  for (const r of responses) {
    if (!questionIds.has(r.questionId)) {
      return { ok: false, message: "Pergunta inválida no envio." };
    }
  }

  const answerById = new Map(
    questions.flatMap((q) => q.answers.map((a) => [a.id, a])),
  );

  let correctCount = 0;
  const responsesToCreate: {
    attemptId: string;
    questionId: string;
    answerId: string;
    isCorrect: boolean;
  }[] = [];

  for (const r of responses) {
    const answer = answerById.get(r.answerId);
    if (!answer) {
      return { ok: false, message: "Alternativa inválida no envio." };
    }
    if (answer.questionId !== r.questionId) {
      return {
        ok: false,
        message: "Alternativa não pertence à pergunta informada.",
      };
    }
    if (answer.isCorrect) correctCount++;
    responsesToCreate.push({
      attemptId,
      questionId: r.questionId,
      answerId: r.answerId,
      isCorrect: answer.isCorrect,
    });
  }

  const total = questions.length;
  const score = Math.round((correctCount / total) * 100);
  const passed = score >= attempt.enrollment.course.passingScore;

  const finishedBefore = await db.quizAttempt.count({
    where: {
      enrollmentId: attempt.enrollmentId,
      finishedAt: { not: null },
    },
  });
  const willBeUsed = finishedBefore + 1;
  const remaining = Math.max(
    0,
    attempt.enrollment.attemptsAllowed - willBeUsed,
  );

  const nextStatus: "COMPLETED" | "IN_PROGRESS" | "BLOCKED" = passed
    ? "COMPLETED"
    : remaining === 0
      ? "BLOCKED"
      : "IN_PROGRESS";

  await db.$transaction([
    db.quizResponse.createMany({ data: responsesToCreate }),
    db.quizAttempt.update({
      where: { id: attemptId },
      data: { score, passed, finishedAt: new Date() },
    }),
    db.courseEnrollment.update({
      where: { id: attempt.enrollmentId },
      data: {
        status: nextStatus,
        completedAt: passed
          ? new Date()
          : attempt.enrollment.completedAt,
      },
    }),
  ]);

  // Se passou, gera o Certificate (com snapshots). PDF é gerado lazy no download.
  if (passed) {
    await ensureCertificateForAttempt({
      userId: user.id,
      courseId,
      attemptId,
    });
  }

  await writeAuditLog({
    userId: user.id,
    action: "QUIZ_ATTEMPT_SUBMIT",
    entity: "QuizAttempt",
    entityId: attemptId,
    metadata: { courseId, score, passed, attemptsRemaining: remaining },
  });

  revalidatePath(`/cursos/${courseId}`);
  revalidatePath(`/cursos/${courseId}/quiz`);
  revalidatePath("/dashboard");
  revalidatePath("/meus-certificados");

  return { ok: true, passed, score };
}

type SimpleResult = { ok: true } | { ok: false; message: string };

export async function abandonQuizAttempt(
  attemptId: string,
): Promise<SimpleResult> {
  const user = await requireSession();
  const attempt = await db.quizAttempt.findUnique({
    where: { id: attemptId },
    include: { enrollment: true },
  });
  if (!attempt) return { ok: false, message: "Tentativa não encontrada." };
  if (attempt.enrollment.userId !== user.id) {
    return { ok: false, message: "Sem permissão." };
  }
  if (attempt.finishedAt) {
    return { ok: false, message: "Esta tentativa já foi enviada." };
  }

  const courseId = attempt.enrollment.courseId;
  const finishedBefore = await db.quizAttempt.count({
    where: {
      enrollmentId: attempt.enrollmentId,
      finishedAt: { not: null },
    },
  });
  const willBeUsed = finishedBefore + 1;
  const remaining = Math.max(
    0,
    attempt.enrollment.attemptsAllowed - willBeUsed,
  );
  const nextStatus: "BLOCKED" | "IN_PROGRESS" =
    remaining === 0 ? "BLOCKED" : "IN_PROGRESS";

  await db.$transaction([
    db.quizAttempt.update({
      where: { id: attemptId },
      data: { score: 0, passed: false, finishedAt: new Date() },
    }),
    db.courseEnrollment.update({
      where: { id: attempt.enrollmentId },
      data: { status: nextStatus },
    }),
  ]);

  await writeAuditLog({
    userId: user.id,
    action: "QUIZ_ATTEMPT_ABANDON",
    entity: "QuizAttempt",
    entityId: attemptId,
    metadata: { courseId },
  });

  revalidatePath(`/cursos/${courseId}/quiz`);
  revalidatePath(`/cursos/${courseId}`);
  revalidatePath("/dashboard");

  return { ok: true };
}

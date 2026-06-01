import { db } from "@/lib/db";

// Coleta tudo que armazenamos sobre um usuário. Retorna um objeto serializável
// pra exportação em JSON (LGPD: direito de acesso/portabilidade).
//
// IMPORTANTE: nunca inclui passwordHash nem tokenHash brutos.
export async function collectPersonalData(userId: string) {
  const [
    user,
    enrollments,
    attempts,
    certificates,
    auditLogs,
    passwordResets,
  ] = await Promise.all([
    db.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        position: true,
        cpf: true,
        photoUrl: true,
        active: true,
        emailVerifiedAt: true,
        lastLoginAt: true,
        passwordChangedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    db.courseEnrollment.findMany({
      where: { userId },
      include: {
        course: { select: { title: true, workloadHours: true } },
      },
    }),
    db.quizAttempt.findMany({
      where: { enrollment: { userId } },
      include: {
        responses: {
          select: {
            questionId: true,
            answerId: true,
            isCorrect: true,
          },
        },
        enrollment: {
          select: { course: { select: { title: true } } },
        },
      },
    }),
    db.certificate.findMany({ where: { userId } }),
    db.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
    db.passwordResetToken.findMany({
      where: { userId },
      // tokenHash propositalmente fora — não é dado do usuário, é credencial.
      select: {
        id: true,
        expiresAt: true,
        usedAt: true,
        createdAt: true,
      },
    }),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    user,
    enrollments: enrollments.map((e) => ({
      courseTitle: e.course.title,
      courseWorkloadHours: e.course.workloadHours,
      status: e.status,
      attemptsAllowed: e.attemptsAllowed,
      enrolledAt: e.enrolledAt,
      watchedAt: e.watchedAt,
      startedAt: e.startedAt,
      completedAt: e.completedAt,
    })),
    attempts: attempts.map((a) => ({
      id: a.id,
      courseTitle: a.enrollment.course.title,
      attemptNumber: a.attemptNumber,
      score: a.score,
      passed: a.passed,
      startedAt: a.startedAt,
      finishedAt: a.finishedAt,
      responseCount: a.responses.length,
      responses: a.responses,
    })),
    certificates,
    auditLogs,
    passwordResets,
  };
}

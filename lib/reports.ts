import { db } from "@/lib/db";

export async function getCourseCompletionStats() {
  const courses = await db.course.findMany({
    include: {
      enrollments: {
        select: { status: true },
      },
    },
    orderBy: { title: "asc" },
  });
  return courses.map((c) => {
    const total = c.enrollments.length;
    const completed = c.enrollments.filter(
      (e) => e.status === "COMPLETED",
    ).length;
    const inProgress = c.enrollments.filter(
      (e) => e.status === "IN_PROGRESS",
    ).length;
    const blocked = c.enrollments.filter(
      (e) => e.status === "BLOCKED",
    ).length;
    const notStarted = c.enrollments.filter(
      (e) => e.status === "NOT_STARTED",
    ).length;
    const completionRate =
      total > 0 ? Math.round((completed / total) * 100) : 0;
    return {
      id: c.id,
      title: c.title,
      category: c.category,
      workloadHours: c.workloadHours,
      active: c.active,
      total,
      completed,
      inProgress,
      blocked,
      notStarted,
      completionRate,
    };
  });
}

export async function getCollaboratorRanking() {
  const users = await db.user.findMany({
    where: { active: true, role: "COLABORADOR" },
    include: {
      enrollments: {
        select: {
          status: true,
          attempts: {
            where: { passed: true },
            select: { score: true },
          },
        },
      },
    },
  });
  const rows = users.map((u) => {
    const total = u.enrollments.length;
    const completed = u.enrollments.filter(
      (e) => e.status === "COMPLETED",
    ).length;
    const scores = u.enrollments.flatMap((e) =>
      e.attempts.map((a) => a.score),
    );
    const avgScore =
      scores.length > 0
        ? Math.round(
            scores.reduce((s, x) => s + x, 0) / scores.length,
          )
        : null;
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      department: u.department,
      position: u.position,
      total,
      completed,
      completionRate:
        total > 0 ? Math.round((completed / total) * 100) : 0,
      avgScore,
    };
  });
  // Ranking: mais concluídos primeiro, depois nota média desc, depois nome asc.
  rows.sort((a, b) => {
    if (b.completed !== a.completed) return b.completed - a.completed;
    if ((b.avgScore ?? 0) !== (a.avgScore ?? 0)) {
      return (b.avgScore ?? 0) - (a.avgScore ?? 0);
    }
    return a.name.localeCompare(b.name, "pt-BR");
  });
  return rows;
}

export async function listAllCertificates(limit = 500) {
  return db.certificate.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          department: true,
        },
      },
    },
    orderBy: { issuedAt: "desc" },
    take: limit,
  });
}

export async function listFinishedAttempts(limit = 500) {
  return db.quizAttempt.findMany({
    where: { finishedAt: { not: null } },
    include: {
      enrollment: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              department: true,
            },
          },
          course: {
            select: { id: true, title: true, passingScore: true },
          },
        },
      },
    },
    orderBy: { finishedAt: "desc" },
    take: limit,
  });
}

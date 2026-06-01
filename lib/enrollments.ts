import { db } from "@/lib/db";

export async function getMyEnrollments(userId: string) {
  return db.courseEnrollment.findMany({
    where: { userId },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          category: true,
          workloadHours: true,
          active: true,
        },
      },
      _count: { select: { attempts: true } },
    },
    orderBy: [{ status: "asc" }, { enrolledAt: "desc" }],
  });
}

export async function getMyEnrollmentForCourse(
  userId: string,
  courseId: string,
) {
  return db.courseEnrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
    include: {
      course: true,
      attempts: {
        orderBy: { attemptNumber: "desc" },
        select: {
          id: true,
          attemptNumber: true,
          score: true,
          passed: true,
          startedAt: true,
          finishedAt: true,
        },
      },
    },
  });
}

export async function getMyCompletedEnrollments(userId: string) {
  return db.courseEnrollment.findMany({
    where: { userId, status: "COMPLETED" },
    include: {
      course: { select: { id: true, title: true, workloadHours: true } },
      attempts: {
        where: { passed: true },
        orderBy: { finishedAt: "desc" },
        take: 1,
        select: { score: true, finishedAt: true },
      },
    },
    orderBy: { completedAt: "desc" },
  });
}

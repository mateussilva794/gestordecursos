import type { Prisma, Role } from "@prisma/client";

import { db } from "@/lib/db";

export const USERS_PAGE_SIZE = 20;

export type UsersStatusFilter = "all" | "active" | "inactive";
export type UsersRoleFilter = Role | "all";

export type ListUsersParams = {
  search?: string;
  role?: UsersRoleFilter;
  department?: string;
  status?: UsersStatusFilter;
  page?: number;
};

export async function listUsers(params: ListUsersParams = {}) {
  const page = Math.max(1, params.page ?? 1);
  const where: Prisma.UserWhereInput = {};

  if (params.search && params.search.trim() !== "") {
    const s = params.search.trim();
    where.OR = [
      { name: { contains: s, mode: "insensitive" } },
      { email: { contains: s, mode: "insensitive" } },
    ];
  }
  if (params.role && params.role !== "all") {
    where.role = params.role;
  }
  if (params.department && params.department.trim() !== "") {
    where.department = params.department.trim();
  }
  if (params.status === "active") where.active = true;
  if (params.status === "inactive") where.active = false;

  const [items, total] = await Promise.all([
    db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * USERS_PAGE_SIZE,
      take: USERS_PAGE_SIZE,
      include: { _count: { select: { enrollments: true } } },
    }),
    db.user.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / USERS_PAGE_SIZE));
  return { items, total, page, totalPages, pageSize: USERS_PAGE_SIZE };
}

export async function getDepartmentSuggestions(): Promise<string[]> {
  const rows = await db.user.findMany({
    where: { department: { not: null } },
    select: { department: true },
    distinct: ["department"],
    orderBy: { department: "asc" },
  });
  return rows
    .map((r) => r.department)
    .filter((d): d is string => typeof d === "string" && d.trim() !== "");
}

export async function getUserById(id: string) {
  return db.user.findUnique({
    where: { id },
    include: { _count: { select: { enrollments: true } } },
  });
}

export async function getUserEnrollments(userId: string) {
  return db.courseEnrollment.findMany({
    where: { userId },
    include: {
      course: {
        select: { id: true, title: true, active: true, maxAttempts: true },
      },
      _count: { select: { attempts: true } },
    },
    orderBy: { enrolledAt: "desc" },
  });
}

export async function getAvailableCoursesForUser(userId: string) {
  const enrolled = await db.courseEnrollment.findMany({
    where: { userId },
    select: { courseId: true },
  });
  const enrolledIds = enrolled.map((e) => e.courseId);
  return db.course.findMany({
    where: {
      active: true,
      id: { notIn: enrolledIds.length > 0 ? enrolledIds : ["__none__"] },
    },
    orderBy: { title: "asc" },
    select: { id: true, title: true, workloadHours: true },
  });
}

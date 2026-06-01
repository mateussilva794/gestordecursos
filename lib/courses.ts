import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";

export const COURSES_PAGE_SIZE = 10;

export type CourseStatusFilter = "all" | "active" | "inactive";

export type ListCoursesParams = {
  search?: string;
  category?: string;
  status?: CourseStatusFilter;
  page?: number;
};

export async function listCourses(params: ListCoursesParams = {}) {
  const page = Math.max(1, params.page ?? 1);
  const where: Prisma.CourseWhereInput = {};

  if (params.search && params.search.trim() !== "") {
    where.title = { contains: params.search.trim(), mode: "insensitive" };
  }
  if (params.category && params.category.trim() !== "") {
    where.category = params.category.trim();
  }
  if (params.status === "active") where.active = true;
  if (params.status === "inactive") where.active = false;

  const [items, total] = await Promise.all([
    db.course.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * COURSES_PAGE_SIZE,
      take: COURSES_PAGE_SIZE,
      include: {
        _count: { select: { questions: true, enrollments: true } },
      },
    }),
    db.course.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / COURSES_PAGE_SIZE));

  return { items, total, page, totalPages, pageSize: COURSES_PAGE_SIZE };
}

export async function getCategorySuggestions(): Promise<string[]> {
  const rows = await db.course.findMany({
    where: { category: { not: null } },
    select: { category: true },
    distinct: ["category"],
    orderBy: { category: "asc" },
  });
  return rows
    .map((row) => row.category)
    .filter((c): c is string => typeof c === "string" && c.trim() !== "");
}

export async function getCourseById(id: string) {
  return db.course.findUnique({
    where: { id },
    include: {
      _count: { select: { questions: true, enrollments: true } },
    },
  });
}

export async function getCourseWithQuestions(id: string) {
  return db.course.findUnique({
    where: { id },
    include: {
      questions: {
        orderBy: { order: "asc" },
        include: { answers: { orderBy: { order: "asc" } } },
      },
      _count: { select: { enrollments: true } },
    },
  });
}

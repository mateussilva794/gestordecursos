import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";

export const AUDIT_PAGE_SIZE = 30;

export type AuditFilterParams = {
  action?: string;
  userEmail?: string;
  entity?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
};

export async function listAuditLogs(params: AuditFilterParams = {}) {
  const page = Math.max(1, params.page ?? 1);
  const where: Prisma.AuditLogWhereInput = {};

  if (params.action && params.action.trim() !== "") {
    where.action = { contains: params.action.trim(), mode: "insensitive" };
  }
  if (params.userEmail && params.userEmail.trim() !== "") {
    where.user = {
      email: { contains: params.userEmail.trim(), mode: "insensitive" },
    };
  }
  if (params.entity && params.entity.trim() !== "") {
    where.entity = { contains: params.entity.trim(), mode: "insensitive" };
  }
  if (params.startDate || params.endDate) {
    where.createdAt = {};
    if (params.startDate) where.createdAt.gte = params.startDate;
    if (params.endDate) where.createdAt.lte = params.endDate;
  }

  const [items, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: AUDIT_PAGE_SIZE,
      skip: (page - 1) * AUDIT_PAGE_SIZE,
    }),
    db.auditLog.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / AUDIT_PAGE_SIZE));
  return { items, total, page, totalPages, pageSize: AUDIT_PAGE_SIZE };
}

export async function listDistinctAuditActions(): Promise<string[]> {
  const rows = await db.auditLog.findMany({
    select: { action: true },
    distinct: ["action"],
    orderBy: { action: "asc" },
  });
  return rows.map((r) => r.action);
}

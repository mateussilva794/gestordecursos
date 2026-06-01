import { headers } from "next/headers";

import { db } from "@/lib/db";

type AuditLogInput = {
  userId?: string | null;
  action: string;
  entity?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
  ip?: string | null;
  userAgent?: string | null;
};

export async function writeAuditLog(input: AuditLogInput): Promise<void> {
  let ip = input.ip ?? null;
  let userAgent = input.userAgent ?? null;

  // Se o chamador não passou ip/userAgent, tenta ler dos headers da request atual.
  // headers() lança fora de contexto de request — engolimos o erro nesses casos.
  if (ip === null || userAgent === null) {
    try {
      const h = headers();
      if (ip === null) {
        const fwd = h.get("x-forwarded-for");
        ip = fwd ? fwd.split(",")[0]?.trim() ?? null : h.get("x-real-ip");
      }
      if (userAgent === null) {
        userAgent = h.get("user-agent");
      }
    } catch {
      // fora de contexto de request — segue com null
    }
  }

  await db.auditLog.create({
    data: {
      userId: input.userId ?? null,
      action: input.action,
      entity: input.entity ?? null,
      entityId: input.entityId ?? null,
      ip,
      userAgent,
      metadata: (input.metadata ?? undefined) as never,
    },
  });
}

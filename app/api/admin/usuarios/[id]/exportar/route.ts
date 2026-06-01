import { writeAuditLog } from "@/lib/audit";
import { db } from "@/lib/db";
import { guardApiRoute } from "@/lib/guards";
import { collectPersonalData } from "@/lib/lgpd";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const denied = await guardApiRoute("ADMIN");
  if (denied) return denied;

  const user = await db.user.findUnique({ where: { id: params.id } });
  if (!user) {
    return new Response("Usuário não encontrado.", { status: 404 });
  }

  const data = await collectPersonalData(params.id);

  await writeAuditLog({
    action: "EXPORT_DATA",
    entity: "User",
    entityId: params.id,
    metadata: { method: "admin", targetEmail: user.email },
  });

  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(JSON.stringify(data, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="dados-${user.id}-${stamp}.json"`,
      "Cache-Control": "no-store",
    },
  });
}

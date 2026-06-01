import { writeAuditLog } from "@/lib/audit";
import { requireSession } from "@/lib/guards";
import { collectPersonalData } from "@/lib/lgpd";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireSession();
  const data = await collectPersonalData(user.id);

  await writeAuditLog({
    userId: user.id,
    action: "EXPORT_DATA",
    entity: "User",
    entityId: user.id,
    metadata: { method: "self-service" },
  });

  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(JSON.stringify(data, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="meus-dados-${stamp}.json"`,
      "Cache-Control": "no-store",
    },
  });
}

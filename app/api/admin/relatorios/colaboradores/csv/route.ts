import { buildCsv, csvResponse } from "@/lib/csv-export";
import { guardApiRoute } from "@/lib/guards";
import { getCollaboratorRanking } from "@/lib/reports";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await guardApiRoute("RH");
  if (denied) return denied;
  const ranking = await getCollaboratorRanking();

  const headers = [
    "posicao",
    "nome",
    "email",
    "departamento",
    "cargo",
    "matriculas_total",
    "concluidos",
    "taxa_conclusao_pct",
    "nota_media",
  ];
  const rows = ranking.map((u, idx) => [
    idx + 1,
    u.name,
    u.email,
    u.department,
    u.position,
    u.total,
    u.completed,
    u.completionRate,
    u.avgScore,
  ]);

  const stamp = new Date().toISOString().slice(0, 10);
  return csvResponse(`colaboradores-${stamp}.csv`, buildCsv(headers, rows));
}

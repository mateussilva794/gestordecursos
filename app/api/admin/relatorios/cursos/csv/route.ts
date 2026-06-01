import { buildCsv, csvResponse } from "@/lib/csv-export";
import { guardApiRoute } from "@/lib/guards";
import { getCourseCompletionStats } from "@/lib/reports";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await guardApiRoute("RH");
  if (denied) return denied;
  const stats = await getCourseCompletionStats();

  const headers = [
    "id",
    "titulo",
    "categoria",
    "carga_horas",
    "ativo",
    "matriculas_total",
    "concluidos",
    "em_andamento",
    "bloqueados",
    "nao_iniciados",
    "taxa_conclusao_pct",
  ];
  const rows = stats.map((s) => [
    s.id,
    s.title,
    s.category,
    s.workloadHours,
    s.active,
    s.total,
    s.completed,
    s.inProgress,
    s.blocked,
    s.notStarted,
    s.completionRate,
  ]);

  const stamp = new Date().toISOString().slice(0, 10);
  return csvResponse(`cursos-${stamp}.csv`, buildCsv(headers, rows));
}

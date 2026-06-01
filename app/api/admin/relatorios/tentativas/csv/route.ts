import { buildCsv, csvResponse } from "@/lib/csv-export";
import { guardApiRoute } from "@/lib/guards";
import { listFinishedAttempts } from "@/lib/reports";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await guardApiRoute("RH");
  if (denied) return denied;
  const attempts = await listFinishedAttempts(10000);

  const headers = [
    "tentativa_id",
    "iniciada_em",
    "finalizada_em",
    "colaborador",
    "email",
    "departamento",
    "curso",
    "tentativa_numero",
    "nota",
    "nota_minima_curso",
    "aprovado",
  ];
  const rows = attempts.map((a) => [
    a.id,
    a.startedAt,
    a.finishedAt,
    a.enrollment.user.name,
    a.enrollment.user.email,
    a.enrollment.user.department,
    a.enrollment.course.title,
    a.attemptNumber,
    a.score,
    a.enrollment.course.passingScore,
    a.passed,
  ]);

  const stamp = new Date().toISOString().slice(0, 10);
  return csvResponse(`tentativas-${stamp}.csv`, buildCsv(headers, rows));
}

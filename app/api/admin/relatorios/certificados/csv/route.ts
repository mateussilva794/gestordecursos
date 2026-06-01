import { buildCsv, csvResponse } from "@/lib/csv-export";
import { guardApiRoute } from "@/lib/guards";
import { listAllCertificates } from "@/lib/reports";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await guardApiRoute("RH");
  if (denied) return denied;
  const certificates = await listAllCertificates(10000);

  const headers = [
    "codigo_validacao",
    "emitido_em",
    "colaborador",
    "email",
    "departamento",
    "cpf_snapshot",
    "curso",
    "carga_horas",
    "nota",
    "hash_pdf",
  ];
  const rows = certificates.map((c) => [
    c.validationCode,
    c.issuedAt,
    c.userNameSnapshot,
    c.user.email,
    c.user.department,
    c.userCpfSnapshot,
    c.courseTitleSnapshot,
    c.workloadHoursSnapshot,
    c.scoreSnapshot,
    c.pdfHash,
  ]);

  const stamp = new Date().toISOString().slice(0, 10);
  return csvResponse(`certificados-${stamp}.csv`, buildCsv(headers, rows));
}

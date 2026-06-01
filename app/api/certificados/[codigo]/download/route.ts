import { NextResponse } from "next/server";

import { writeAuditLog } from "@/lib/audit";
import { loadOrGenerateCertificatePdf } from "@/lib/certificates";
import { db } from "@/lib/db";

// Garante runtime Node (não edge) — @react-pdf/renderer usa APIs nativas.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { codigo: string } },
) {
  const certificate = await db.certificate.findUnique({
    where: { validationCode: params.codigo },
  });
  if (!certificate) {
    return new NextResponse("Certificado não encontrado.", { status: 404 });
  }

  const { buffer } = await loadOrGenerateCertificatePdf(certificate.id);

  await writeAuditLog({
    action: "CERTIFICATE_DOWNLOAD",
    entity: "Certificate",
    entityId: certificate.id,
    metadata: { validationCode: certificate.validationCode },
  });

  // Buffer → Uint8Array (zero-copy view). Cast porque BodyInit dos tipos do
  // Next 14 nesta combo de versão não inclui BufferSource explicitamente.
  const body = new Uint8Array(
    buffer.buffer,
    buffer.byteOffset,
    buffer.byteLength,
  );

  return new NextResponse(body as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="certificado-${certificate.validationCode.slice(0, 8)}.pdf"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}

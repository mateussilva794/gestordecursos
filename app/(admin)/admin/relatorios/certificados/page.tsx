import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listAllCertificates } from "@/lib/reports";

export const metadata = { title: "Certificados emitidos" };

export default async function CertificatesReportPage() {
  const certificates = await listAllCertificates(500);

  return (
    <main className="container mx-auto space-y-6 p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/admin/relatorios"
            className="text-sm text-muted-foreground hover:underline"
          >
            ← Relatórios
          </Link>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Certificados emitidos
          </h1>
          <p className="text-muted-foreground">
            {certificates.length === 500
              ? "Exibindo os 500 mais recentes."
              : `${certificates.length} certificado(s) emitido(s).`}
          </p>
        </div>
        <Button asChild>
          <a href="/api/admin/relatorios/certificados/csv">Exportar CSV</a>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Emitido em</TableHead>
                <TableHead>Colaborador</TableHead>
                <TableHead>Departamento</TableHead>
                <TableHead>Curso</TableHead>
                <TableHead className="text-right">Carga</TableHead>
                <TableHead className="text-right">Nota</TableHead>
                <TableHead>Código</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {certificates.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="py-8 text-center text-muted-foreground"
                  >
                    Nenhum certificado emitido ainda.
                  </TableCell>
                </TableRow>
              ) : null}
              {certificates.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="text-sm">
                    {c.issuedAt.toLocaleString("pt-BR")}
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{c.userNameSnapshot}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.user.email}
                    </p>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {c.user.department ?? "—"}
                  </TableCell>
                  <TableCell>{c.courseTitleSnapshot}</TableCell>
                  <TableCell className="text-right">
                    {c.workloadHoursSnapshot}h
                  </TableCell>
                  <TableCell className="text-right">
                    {c.scoreSnapshot}%
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {c.validationCode.slice(0, 8)}...
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button asChild variant="ghost" size="sm">
                        <a
                          href={`/api/certificados/${c.validationCode}/download`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          PDF
                        </a>
                      </Button>
                      <Button asChild variant="ghost" size="sm">
                        <Link
                          href={`/validar/${c.validationCode}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Validar
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}

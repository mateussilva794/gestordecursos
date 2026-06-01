import Link from "next/link";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCpf } from "@/lib/cpf";
import { db } from "@/lib/db";

export const metadata = { title: "Validação de certificado" };

export default async function ValidateCertificatePage({
  params,
}: {
  params: { codigo: string };
}) {
  const certificate = await db.certificate.findUnique({
    where: { validationCode: params.codigo },
  });

  if (!certificate) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>Certificado não encontrado</CardTitle>
            <CardDescription>
              O código informado não corresponde a nenhum certificado válido.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>
                Verifique se digitou o código corretamente, incluindo hífens.
              </AlertDescription>
            </Alert>
            <p className="mt-4 text-center text-sm">
              <Link
                href="/login"
                className="text-primary underline-offset-4 hover:underline"
              >
                Voltar
              </Link>
            </p>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Certificado válido</CardTitle>
              <CardDescription>
                Emitido pela plataforma interna de treinamentos.
              </CardDescription>
            </div>
            <Badge variant="success">Autêntico</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs uppercase text-muted-foreground">
              Colaborador
            </p>
            <p className="text-lg font-medium">
              {certificate.userNameSnapshot}
            </p>
            {certificate.userCpfSnapshot ? (
              <p className="text-sm text-muted-foreground">
                CPF: {formatCpf(certificate.userCpfSnapshot)}
              </p>
            ) : null}
          </div>

          <div>
            <p className="text-xs uppercase text-muted-foreground">Curso</p>
            <p className="text-base font-medium">
              {certificate.courseTitleSnapshot}
            </p>
            <p className="text-sm text-muted-foreground">
              Carga horária: {certificate.workloadHoursSnapshot}h · Nota:{" "}
              {certificate.scoreSnapshot}%
            </p>
          </div>

          <div>
            <p className="text-xs uppercase text-muted-foreground">Emissão</p>
            <p className="text-base">
              {certificate.issuedAt.toLocaleString("pt-BR")}
            </p>
          </div>

          <div>
            <p className="text-xs uppercase text-muted-foreground">
              Código de validação
            </p>
            <p className="break-all font-mono text-sm">
              {certificate.validationCode}
            </p>
          </div>

          {certificate.pdfHash ? (
            <div className="rounded-md border bg-muted/30 p-3">
              <p className="text-xs uppercase text-muted-foreground">
                Hash do PDF (SHA-256)
              </p>
              <p className="mt-1 break-all font-mono text-xs">
                {certificate.pdfHash}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Se o PDF apresentado tiver hash diferente, o documento foi
                alterado.
              </p>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3 pt-2">
            <Button asChild>
              <a
                href={`/api/certificados/${certificate.validationCode}/download`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Baixar PDF
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

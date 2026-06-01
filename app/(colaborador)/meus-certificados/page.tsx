import Link from "next/link";
import { getServerSession } from "next-auth";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authOptions } from "@/lib/auth";
import { backfillCertificatesForUser } from "@/lib/certificates";
import { db } from "@/lib/db";

export const metadata = { title: "Meus certificados" };

export default async function MyCertificatesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  // Garante que enrollments COMPLETED tenham Certificate (backfill lazy
  // para enrollments concluídos antes da Fase 7 ou via simulação).
  await backfillCertificatesForUser(session.user.id);

  const certificates = await db.certificate.findMany({
    where: { userId: session.user.id },
    orderBy: { issuedAt: "desc" },
  });

  return (
    <main className="container mx-auto max-w-4xl space-y-6 p-8">
      <div>
        <Link
          href="/dashboard"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Painel
        </Link>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Meus certificados
        </h1>
        <p className="text-muted-foreground">
          {certificates.length === 0
            ? "Você ainda não concluiu nenhum curso."
            : `${certificates.length} certificado(s) disponível(is).`}
        </p>
      </div>

      {certificates.length === 0 ? null : (
        <div className="space-y-4">
          {certificates.map((c) => (
            <Card key={c.id}>
              <CardHeader>
                <CardTitle className="text-base">
                  {c.courseTitleSnapshot}
                </CardTitle>
                <CardDescription>
                  {c.workloadHoursSnapshot}h · Concluído em{" "}
                  {c.issuedAt.toLocaleDateString("pt-BR")} · Nota{" "}
                  {c.scoreSnapshot}%
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Código de validação:{" "}
                  <span className="font-mono">{c.validationCode}</span>
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button asChild>
                    <a
                      href={`/api/certificados/${c.validationCode}/download`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Baixar PDF
                    </a>
                  </Button>
                  <Button asChild variant="outline">
                    <Link
                      href={`/validar/${c.validationCode}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Ver página pública
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}

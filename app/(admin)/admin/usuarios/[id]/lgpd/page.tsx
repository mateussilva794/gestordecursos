import Link from "next/link";
import { notFound } from "next/navigation";

import { AnonymizeUserButton } from "@/components/forms/anonymize-user-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { db } from "@/lib/db";

export const metadata = { title: "LGPD do usuário" };

function isAnonymizedEmail(email: string): boolean {
  return email.startsWith("anon-") && email.endsWith("@deleted.local");
}

export default async function UserLgpdPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await db.user.findUnique({ where: { id: params.id } });
  if (!user) notFound();

  const anonymized = isAnonymizedEmail(user.email);

  return (
    <main className="container mx-auto max-w-3xl space-y-6 p-8">
      <div>
        <Link
          href={`/admin/usuarios/${user.id}/editar`}
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Editar usuário
        </Link>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          LGPD: {user.name}
        </h1>
        <p className="text-muted-foreground">{user.email}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Exportar dados</CardTitle>
          <CardDescription>
            Baixa um JSON com tudo que armazenamos sobre este usuário:
            cadastro, matrículas, tentativas, respostas, certificados e
            histórico de auditoria. Hashes de senha e tokens nunca são
            incluídos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <a
              href={`/api/admin/usuarios/${user.id}/exportar`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Exportar dados (JSON)
            </a>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Anonimizar usuário</CardTitle>
          <CardDescription>
            Remove dados pessoais identificáveis (nome, email, CPF, foto) e
            desativa a conta. Preserva matrículas, tentativas, certificados e
            audit logs — esses já guardam snapshots dos dados que valiam no
            momento da emissão. Operação <strong>irreversível</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {anonymized ? (
            <Alert>
              <AlertDescription>
                Este usuário já foi anonimizado em{" "}
                {user.updatedAt.toLocaleString("pt-BR")}.
              </AlertDescription>
            </Alert>
          ) : (
            <AnonymizeUserButton userId={user.id} userName={user.name} />
          )}
        </CardContent>
      </Card>
    </main>
  );
}

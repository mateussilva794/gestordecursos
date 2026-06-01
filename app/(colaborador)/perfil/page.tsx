import Link from "next/link";
import { getServerSession } from "next-auth";

import { ChangePasswordForm } from "@/components/forms/change-password-form";
import { ProfileForm } from "@/components/forms/profile-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata = { title: "Meu perfil" };

const ROLE_LABEL: Record<string, string> = {
  COLABORADOR: "Colaborador",
  RH: "RH",
  ADMIN: "Administrador",
};

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const user = await db.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      department: true,
    },
  });

  return (
    <main className="container mx-auto max-w-3xl space-y-6 p-8">
      <div>
        <Link
          href="/dashboard"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Painel
        </Link>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Meu perfil</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados pessoais</CardTitle>
          <CardDescription>
            Edite seu nome. Email, papel e departamento são gerenciados pelo
            administrador.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm
            defaultName={user.name}
            email={user.email}
            role={ROLE_LABEL[user.role] ?? user.role}
            department={user.department}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Trocar senha</CardTitle>
          <CardDescription>
            Mínimo 8 caracteres e pelo menos 1 número. Trocar senha encerra
            suas sessões em outros dispositivos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Meus dados (LGPD)</CardTitle>
          <CardDescription>
            Baixe um arquivo JSON com todos os dados pessoais que armazenamos
            sobre você (cadastro, matrículas, tentativas, certificados, audit
            logs). Hashes de senha e tokens nunca são incluídos. Para
            solicitar anonimização da sua conta, entre em contato com o RH ou
            Admin.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild>
            <a
              href="/api/perfil/exportar"
              target="_blank"
              rel="noopener noreferrer"
            >
              Exportar meus dados (JSON)
            </a>
          </Button>
          <Button asChild variant="outline">
            <Link href="/privacidade" target="_blank" rel="noopener noreferrer">
              Política de privacidade
            </Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}

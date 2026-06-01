import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";

import { UserForm } from "@/components/forms/user-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authOptions } from "@/lib/auth";
import { getDepartmentSuggestions, getUserById } from "@/lib/users";

export const metadata = { title: "Editar usuário" };

export default async function EditUserPage({
  params,
}: {
  params: { id: string };
}) {
  const [user, departmentSuggestions, session] = await Promise.all([
    getUserById(params.id),
    getDepartmentSuggestions(),
    getServerSession(authOptions),
  ]);
  if (!user) notFound();

  const isSelf = session?.user?.id === user.id;

  return (
    <main className="container mx-auto max-w-3xl space-y-6 p-8">
      <div>
        <Link
          href="/admin/usuarios"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Usuários
        </Link>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Editar usuário
        </h1>
        <p className="text-muted-foreground">
          {user._count.enrollments} matrícula(s).{" "}
          <Link
            href={`/admin/usuarios/${user.id}/matriculas`}
            className="underline underline-offset-4"
          >
            Gerenciar matrículas
          </Link>{" "}
          ·{" "}
          <Link
            href={`/admin/usuarios/${user.id}/lgpd`}
            className="underline underline-offset-4"
          >
            LGPD (exportar/anonimizar)
          </Link>
          .
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Dados do usuário</CardTitle>
          <CardDescription>
            Para reset de senha, use &quot;Reenviar convite&quot; na listagem.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserForm
            mode="edit"
            userId={user.id}
            isSelf={isSelf}
            initialData={{
              name: user.name,
              email: user.email,
              role: user.role,
              department: user.department,
              position: user.position,
              cpf: user.cpf,
              active: user.active,
            }}
            departmentSuggestions={departmentSuggestions}
          />
        </CardContent>
      </Card>
    </main>
  );
}

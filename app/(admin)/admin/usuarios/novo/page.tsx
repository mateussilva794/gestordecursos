import Link from "next/link";

import { UserForm } from "@/components/forms/user-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getDepartmentSuggestions } from "@/lib/users";

export const metadata = { title: "Novo usuário" };

export default async function NewUserPage() {
  const departmentSuggestions = await getDepartmentSuggestions();

  return (
    <main className="container mx-auto max-w-3xl p-8">
      <div className="mb-6">
        <Link
          href="/admin/usuarios"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Usuários
        </Link>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Novo usuário
        </h1>
        <p className="text-muted-foreground">
          Após criar, o sistema gera um link de convite (válido por 7 dias)
          para o usuário definir a própria senha.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Dados do usuário</CardTitle>
          <CardDescription>
            Campos obrigatórios: nome, email, papel.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserForm
            mode="create"
            departmentSuggestions={departmentSuggestions}
          />
        </CardContent>
      </Card>
    </main>
  );
}

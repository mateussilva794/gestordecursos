import Link from "next/link";

import { CsvImportForm } from "@/components/forms/csv-import-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = { title: "Importar usuários (CSV)" };

export default function CsvImportPage() {
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
          Importar usuários
        </h1>
        <p className="text-muted-foreground">
          Cole o conteúdo de um CSV abaixo. Idempotente: emails já cadastrados
          são pulados sem erro.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>CSV</CardTitle>
          <CardDescription>
            Cada linha cria um usuário e dispara um email de convite (stub no
            terminal). Erros por linha são reportados ao final.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CsvImportForm />
        </CardContent>
      </Card>
    </main>
  );
}

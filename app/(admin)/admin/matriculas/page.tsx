import Link from "next/link";

import { BulkEnrollForm } from "@/components/forms/bulk-enroll-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { db } from "@/lib/db";
import { getDepartmentSuggestions } from "@/lib/users";

export const metadata = { title: "Matrículas em massa" };

export default async function BulkEnrollmentsPage() {
  const [courses, departments] = await Promise.all([
    db.course.findMany({
      where: { active: true },
      orderBy: { title: "asc" },
      select: { id: true, title: true, workloadHours: true },
    }),
    getDepartmentSuggestions(),
  ]);

  return (
    <main className="container mx-auto max-w-4xl space-y-6 p-8">
      <div>
        <Link
          href="/admin"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Painel
        </Link>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Matrículas em massa
        </h1>
        <p className="text-muted-foreground">
          Selecione cursos e filtre usuários (papel/departamento/ativos).
          A operação é idempotente — matrículas já existentes são puladas.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Atribuir cursos</CardTitle>
          <CardDescription>
            Use a pré-visualização antes de aplicar para confirmar os números.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BulkEnrollForm courses={courses} departments={departments} />
        </CardContent>
      </Card>
    </main>
  );
}

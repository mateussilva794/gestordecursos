import Link from "next/link";

import { CourseForm } from "@/components/forms/course-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCategorySuggestions } from "@/lib/courses";

export const metadata = {
  title: "Novo curso",
};

export default async function NewCoursePage() {
  const categorySuggestions = await getCategorySuggestions();

  return (
    <main className="container mx-auto max-w-3xl p-8">
      <div className="mb-6">
        <Link
          href="/admin/cursos"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Cursos
        </Link>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Novo curso</h1>
        <p className="text-muted-foreground">
          Após criar, você poderá adicionar as perguntas.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Dados do curso</CardTitle>
          <CardDescription>
            Preencha as informações abaixo. Categoria é opcional.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CourseForm categorySuggestions={categorySuggestions} />
        </CardContent>
      </Card>
    </main>
  );
}

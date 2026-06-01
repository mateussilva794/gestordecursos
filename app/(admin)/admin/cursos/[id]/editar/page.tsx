import Link from "next/link";
import { notFound } from "next/navigation";

import { CourseForm } from "@/components/forms/course-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCategorySuggestions, getCourseById } from "@/lib/courses";

export const metadata = {
  title: "Editar curso",
};

export default async function EditCoursePage({
  params,
}: {
  params: { id: string };
}) {
  const [course, categorySuggestions] = await Promise.all([
    getCourseById(params.id),
    getCategorySuggestions(),
  ]);
  if (!course) notFound();

  return (
    <main className="container mx-auto max-w-3xl space-y-6 p-8">
      <div>
        <Link
          href="/admin/cursos"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Cursos
        </Link>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Editar curso
        </h1>
        <p className="text-muted-foreground">
          {course._count.questions} pergunta(s) · {course._count.enrollments}{" "}
          matrícula(s).
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Dados do curso</CardTitle>
          <CardDescription>
            Edite as informações abaixo.{" "}
            <Link
              className="underline underline-offset-4"
              href={`/admin/cursos/${course.id}/perguntas`}
            >
              Gerenciar perguntas
            </Link>
            .
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CourseForm
            courseId={course.id}
            initialData={{
              title: course.title,
              description: course.description,
              category: course.category,
              workloadHours: course.workloadHours,
              externalUrl: course.externalUrl,
              passingScore: course.passingScore,
              maxAttempts: course.maxAttempts,
              active: course.active,
            }}
            categorySuggestions={categorySuggestions}
          />
        </CardContent>
      </Card>
    </main>
  );
}

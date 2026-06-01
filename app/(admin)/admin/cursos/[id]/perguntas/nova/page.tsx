import Link from "next/link";
import { notFound } from "next/navigation";

import { QuestionForm } from "@/components/forms/question-form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { db } from "@/lib/db";

export const metadata = {
  title: "Nova pergunta",
};

export default async function NewQuestionPage({
  params,
}: {
  params: { id: string };
}) {
  const course = await db.course.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      title: true,
      _count: { select: { questions: true } },
    },
  });
  if (!course) notFound();

  return (
    <main className="container mx-auto max-w-3xl space-y-6 p-8">
      <div>
        <Link
          href={`/admin/cursos/${course.id}/perguntas`}
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Perguntas de &quot;{course.title}&quot;
        </Link>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Nova pergunta
        </h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Conteúdo da pergunta</CardTitle>
        </CardHeader>
        <CardContent>
          <QuestionForm
            courseId={course.id}
            initialData={{
              statement: "",
              order: course._count.questions + 1,
              answers: [
                { text: "", isCorrect: true },
                { text: "", isCorrect: false },
              ],
            }}
          />
        </CardContent>
      </Card>
    </main>
  );
}

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
  title: "Editar pergunta",
};

export default async function EditQuestionPage({
  params,
}: {
  params: { id: string; questionId: string };
}) {
  const question = await db.question.findUnique({
    where: { id: params.questionId },
    include: {
      answers: { orderBy: { order: "asc" } },
      course: { select: { id: true, title: true } },
    },
  });
  if (!question || question.courseId !== params.id) {
    notFound();
  }

  return (
    <main className="container mx-auto max-w-3xl space-y-6 p-8">
      <div>
        <Link
          href={`/admin/cursos/${question.course.id}/perguntas`}
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Perguntas de &quot;{question.course.title}&quot;
        </Link>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Editar pergunta
        </h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Conteúdo da pergunta</CardTitle>
        </CardHeader>
        <CardContent>
          <QuestionForm
            courseId={question.course.id}
            questionId={question.id}
            initialData={{
              statement: question.statement,
              order: question.order,
              answers: question.answers.map((a) => ({
                text: a.text,
                isCorrect: a.isCorrect,
              })),
            }}
          />
        </CardContent>
      </Card>
    </main>
  );
}

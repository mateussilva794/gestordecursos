import Link from "next/link";
import { notFound } from "next/navigation";

import { DeleteQuestionButton } from "@/components/forms/delete-question-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCourseWithQuestions } from "@/lib/courses";
import { db } from "@/lib/db";

export const metadata = {
  title: "Perguntas do curso",
};

export default async function QuestionsListPage({
  params,
}: {
  params: { id: string };
}) {
  const course = await getCourseWithQuestions(params.id);
  if (!course) notFound();

  const attemptsCount = await db.quizAttempt.count({
    where: { enrollment: { courseId: params.id } },
  });

  return (
    <main className="container mx-auto space-y-6 p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/admin/cursos"
            className="text-sm text-muted-foreground hover:underline"
          >
            ← Cursos
          </Link>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            {course.title}
          </h1>
          <p className="text-muted-foreground">
            Perguntas do curso ({course.questions.length}).{" "}
            <Link
              href={`/admin/cursos/${course.id}/editar`}
              className="underline underline-offset-4"
            >
              Editar dados do curso
            </Link>
          </p>
        </div>
        <Button asChild>
          <Link href={`/admin/cursos/${course.id}/perguntas/nova`}>
            Adicionar pergunta
          </Link>
        </Button>
      </div>

      {attemptsCount > 0 ? (
        <Alert>
          <AlertDescription>
            Este curso já tem {attemptsCount} tentativa(s) registrada(s).
            Alterações nas perguntas não afetam respostas já enviadas (mantemos
            snapshot do que valeu na época).
          </AlertDescription>
        </Alert>
      ) : null}

      {course.questions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhuma pergunta cadastrada ainda. Use o botão acima para começar.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {course.questions.map((q, qIdx) => (
            <Card key={q.id}>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-xs uppercase text-muted-foreground">
                      Pergunta {qIdx + 1} · ordem {q.order}
                    </p>
                    <CardTitle className="text-base font-medium">
                      {q.statement}
                    </CardTitle>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button asChild variant="outline" size="sm">
                      <Link
                        href={`/admin/cursos/${course.id}/perguntas/${q.id}/editar`}
                      >
                        Editar
                      </Link>
                    </Button>
                    <DeleteQuestionButton
                      courseId={course.id}
                      questionId={q.id}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {q.answers.map((a) => (
                    <li
                      key={a.id}
                      className="flex items-start gap-3 text-sm"
                    >
                      {a.isCorrect ? (
                        <Badge variant="success" className="shrink-0">
                          Correta
                        </Badge>
                      ) : (
                        <Badge variant="muted" className="shrink-0">
                          ·
                        </Badge>
                      )}
                      <span className={a.isCorrect ? "font-medium" : ""}>
                        {a.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}

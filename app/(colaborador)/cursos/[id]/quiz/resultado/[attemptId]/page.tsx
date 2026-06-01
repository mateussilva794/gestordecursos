import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
import { getAttemptWithGrading } from "@/lib/quiz";

export const metadata = { title: "Resultado" };

export default async function QuizResultPage({
  params,
}: {
  params: { id: string; attemptId: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const attempt = await getAttemptWithGrading(params.attemptId);
  if (!attempt) notFound();
  if (attempt.enrollment.userId !== session.user.id) notFound();
  if (attempt.enrollment.courseId !== params.id) notFound();

  if (!attempt.finishedAt) {
    return (
      <main className="container mx-auto max-w-2xl space-y-4 p-8">
        <Alert variant="destructive">
          <AlertDescription>
            Esta tentativa ainda não foi enviada.
          </AlertDescription>
        </Alert>
        <Button asChild variant="outline">
          <Link href={`/cursos/${params.id}/quiz`}>Voltar ao quiz</Link>
        </Button>
      </main>
    );
  }

  const { enrollment, responses } = attempt;
  const { course } = enrollment;

  const isBlocked = enrollment.status === "BLOCKED";
  const isCompleted = enrollment.status === "COMPLETED";
  const showGabarito = isCompleted || isBlocked;

  const certificate = attempt.passed
    ? await db.certificate.findUnique({ where: { attemptId: attempt.id } })
    : null;

  const fullQuestions = showGabarito
    ? await db.question.findMany({
        where: { courseId: course.id },
        include: { answers: { orderBy: { order: "asc" } } },
        orderBy: { order: "asc" },
      })
    : [];

  const responseByQuestionId = new Map(
    responses.map((r) => [r.questionId, r]),
  );

  return (
    <main className="container mx-auto max-w-3xl space-y-6 p-8">
      <div>
        <Link
          href={`/cursos/${params.id}`}
          className="text-sm text-muted-foreground hover:underline"
        >
          ← {course.title}
        </Link>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Tentativa #{attempt.attemptNumber}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-2xl">
                {attempt.score}% ·{" "}
                {attempt.passed ? "Aprovado" : "Reprovado"}
              </CardTitle>
              <CardDescription>
                Nota mínima: {course.passingScore}%
              </CardDescription>
            </div>
            {attempt.passed ? (
              <Badge variant="success">Passou</Badge>
            ) : (
              <Badge variant="muted">Não passou</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {attempt.passed ? (
            <Alert>
              <AlertDescription>
                Parabéns! Você concluiu o curso. O certificado estará
                disponível em &quot;Meus certificados&quot;.
              </AlertDescription>
            </Alert>
          ) : isBlocked ? (
            <Alert variant="destructive">
              <AlertDescription>
                Tentativas esgotadas. Peça ao RH para liberar uma nova
                tentativa.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <AlertDescription>
                Você ainda tem tentativas disponíveis. Revise o conteúdo na
                Cefis e tente novamente.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href={`/cursos/${params.id}`}>Voltar ao curso</Link>
            </Button>
            {attempt.passed ? (
              <Button asChild variant="outline">
                <Link href="/meus-certificados">Meus certificados</Link>
              </Button>
            ) : null}
            {certificate ? (
              <Button asChild>
                <a
                  href={`/api/certificados/${certificate.validationCode}/download`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Baixar certificado
                </a>
              </Button>
            ) : null}
            {!attempt.passed && !isBlocked ? (
              <Button asChild variant="outline">
                <Link href={`/cursos/${params.id}/quiz`}>
                  Tentar novamente
                </Link>
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {showGabarito ? (
        <Card>
          <CardHeader>
            <CardTitle>Gabarito</CardTitle>
            <CardDescription>
              Veja as respostas corretas e o que você escolheu.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {fullQuestions.map((q, qIdx) => {
              const userResponse = responseByQuestionId.get(q.id);
              const userAnswerId = userResponse?.answerId;
              return (
                <div
                  key={q.id}
                  className="space-y-2 border-t pt-4 first:border-t-0 first:pt-0"
                >
                  <p className="font-medium">
                    {qIdx + 1}. {q.statement}
                  </p>
                  <ul className="space-y-1.5">
                    {q.answers.map((a) => {
                      const isUserChoice = a.id === userAnswerId;
                      const isCorrect = a.isCorrect;
                      let className =
                        "flex items-start gap-2 rounded-md border px-3 py-2 text-sm";
                      if (isCorrect) {
                        className +=
                          " border-emerald-200 bg-emerald-50 text-emerald-900";
                      } else if (isUserChoice) {
                        className +=
                          " border-rose-200 bg-rose-50 text-rose-900";
                      } else {
                        className += " border-transparent";
                      }
                      return (
                        <li key={a.id} className={className}>
                          <span className="w-4 shrink-0 font-mono text-xs">
                            {isCorrect ? "✓" : isUserChoice ? "✗" : ""}
                          </span>
                          <span className="flex-1">{a.text}</span>
                          {isUserChoice ? (
                            <Badge variant="muted">sua escolha</Badge>
                          ) : null}
                          {isCorrect ? (
                            <Badge variant="success">correta</Badge>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            O gabarito só fica visível após você concluir o curso ou esgotar
            as tentativas.
          </CardContent>
        </Card>
      )}
    </main>
  );
}

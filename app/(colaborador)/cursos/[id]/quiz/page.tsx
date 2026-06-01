import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";

import { AbandonQuizButton } from "@/components/colaborador/abandon-quiz-button";
import { QuizForm } from "@/components/colaborador/quiz-form";
import { StartQuizButton } from "@/components/colaborador/start-quiz-button";
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
import { getMyEnrollmentForCourse } from "@/lib/enrollments";
import { getQuizForAttempt } from "@/lib/quiz";

export const metadata = { title: "Quiz" };

export default async function QuizPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const enrollment = await getMyEnrollmentForCourse(
    session.user.id,
    params.id,
  );
  if (!enrollment) notFound();

  if (!enrollment.watchedAt) {
    return (
      <main className="container mx-auto max-w-2xl space-y-4 p-8">
        <Alert variant="destructive">
          <AlertDescription>
            Você ainda não marcou o vídeo como assistido.
          </AlertDescription>
        </Alert>
        <Button asChild variant="outline">
          <Link href={`/cursos/${params.id}`}>Voltar ao curso</Link>
        </Button>
      </main>
    );
  }

  if (enrollment.status === "COMPLETED") {
    const lastPassed = enrollment.attempts.find((a) => a.passed);
    return (
      <main className="container mx-auto max-w-2xl space-y-4 p-8">
        <Card>
          <CardHeader>
            <CardTitle>Curso concluído</CardTitle>
            <CardDescription>
              {lastPassed ? `Você passou com nota ${lastPassed.score}%.` : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href={`/cursos/${params.id}`}>Voltar ao curso</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/meus-certificados">Meus certificados</Link>
              </Button>
              {lastPassed ? (
                <Button asChild variant="outline">
                  <Link
                    href={`/cursos/${params.id}/quiz/resultado/${lastPassed.id}`}
                  >
                    Ver gabarito
                  </Link>
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  const finishedAttempts = enrollment.attempts.filter(
    (a) => a.finishedAt !== null,
  );
  const openAttempt = enrollment.attempts.find((a) => a.finishedAt === null);
  const attemptsRemaining = Math.max(
    0,
    enrollment.attemptsAllowed - finishedAttempts.length,
  );

  if (
    enrollment.status === "BLOCKED" ||
    (attemptsRemaining === 0 && !openAttempt)
  ) {
    const lastAttempt = finishedAttempts[0];
    return (
      <main className="container mx-auto max-w-2xl space-y-4 p-8">
        <Card>
          <CardHeader>
            <CardTitle>Tentativas esgotadas</CardTitle>
            <CardDescription>
              Você usou todas as {enrollment.attemptsAllowed} tentativa(s) sem
              atingir a nota mínima. Peça ao RH para liberar uma nova
              tentativa.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="outline">
                <Link href={`/cursos/${params.id}`}>Voltar ao curso</Link>
              </Button>
              {lastAttempt ? (
                <Button asChild variant="outline">
                  <Link
                    href={`/cursos/${params.id}/quiz/resultado/${lastAttempt.id}`}
                  >
                    Ver gabarito da última tentativa
                  </Link>
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (!enrollment.course.active && !openAttempt) {
    return (
      <main className="container mx-auto max-w-2xl space-y-4 p-8">
        <Alert variant="destructive">
          <AlertDescription>
            Curso desativado pelo administrador. Não é possível iniciar novas
            tentativas.
          </AlertDescription>
        </Alert>
        <Button asChild variant="outline">
          <Link href={`/cursos/${params.id}`}>Voltar ao curso</Link>
        </Button>
      </main>
    );
  }

  if (openAttempt) {
    const questions = await getQuizForAttempt(openAttempt.id, params.id);
    return (
      <main className="container mx-auto max-w-3xl space-y-6 p-8">
        <div>
          <Link
            href={`/cursos/${params.id}`}
            className="text-sm text-muted-foreground hover:underline"
          >
            ← {enrollment.course.title}
          </Link>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              Tentativa #{openAttempt.attemptNumber} de{" "}
              {enrollment.attemptsAllowed}
            </h1>
            <Badge variant="secondary">
              {questions.length} pergunta(s)
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Nota mínima: {enrollment.course.passingScore}%. Responda todas e
            clique em &quot;Enviar respostas&quot;.
          </p>
        </div>

        <QuizForm
          attemptId={openAttempt.id}
          courseId={params.id}
          questions={questions}
        />

        <div className="border-t pt-4">
          <AbandonQuizButton
            attemptId={openAttempt.id}
            courseId={params.id}
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Abandonar conta como reprovação e gasta esta tentativa.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto max-w-2xl space-y-4 p-8">
      <Card>
        <CardHeader>
          <CardTitle>Iniciar quiz</CardTitle>
          <CardDescription>
            Tentativa {finishedAttempts.length + 1} de{" "}
            {enrollment.attemptsAllowed}. Nota mínima:{" "}
            {enrollment.course.passingScore}%.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              Ao iniciar, a tentativa é contabilizada. Se você abandonar
              (fechar o browser ou clicar &quot;Abandonar&quot;), conta como
              reprovação.
            </AlertDescription>
          </Alert>
          <div className="flex flex-wrap gap-3">
            <StartQuizButton courseId={params.id} label="Iniciar quiz" />
            <Button asChild variant="outline">
              <Link href={`/cursos/${params.id}`}>Voltar ao curso</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

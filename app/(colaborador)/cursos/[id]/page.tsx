import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";

import { EnrollmentStatusBadge } from "@/components/colaborador/enrollment-status-badge";
import { MarkWatchedButton } from "@/components/forms/mark-watched-button";
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

export const metadata = { title: "Curso" };

export default async function CoursePage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const enrollment = await getMyEnrollmentForCourse(session.user.id, params.id);
  if (!enrollment) notFound();

  const { course, attempts } = enrollment;
  const attemptsUsed = attempts.length;
  const attemptsRemaining = Math.max(
    0,
    enrollment.attemptsAllowed - attemptsUsed,
  );
  const hasWatched = !!enrollment.watchedAt;

  let canTakeQuiz = true;
  let blockReason: string | null = null;
  if (!hasWatched) {
    canTakeQuiz = false;
    blockReason = "Marque como assistido para liberar o quiz.";
  } else if (!course.active) {
    canTakeQuiz = false;
    blockReason = "Este curso foi desativado.";
  } else if (enrollment.status === "COMPLETED") {
    canTakeQuiz = false;
    blockReason = "Você já concluiu este curso.";
  } else if (
    enrollment.status === "BLOCKED" ||
    attemptsRemaining <= 0
  ) {
    canTakeQuiz = false;
    blockReason =
      "Tentativas esgotadas. Peça ao RH para liberar uma nova tentativa.";
  }

  return (
    <main className="container mx-auto max-w-4xl space-y-6 p-8">
      <div>
        <Link
          href="/dashboard"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Painel
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {course.title}
            </h1>
            <p className="text-muted-foreground">
              {course.category ? `${course.category} · ` : ""}
              {course.workloadHours}h · Nota mínima: {course.passingScore}%
            </p>
          </div>
          <EnrollmentStatusBadge status={enrollment.status} />
        </div>
      </div>

      {!course.active ? (
        <Alert variant="destructive">
          <AlertDescription>
            Este curso foi desativado pelo administrador. Você não pode iniciar
            novas tentativas, mas seu histórico fica preservado.
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Descrição</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {course.description}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Como concluir</CardTitle>
          <CardDescription>
            Tentativas: <strong>{attemptsUsed} de {enrollment.attemptsAllowed}</strong>
            {hasWatched ? (
              <>
                {" "}· Marcado como assistido em{" "}
                {enrollment.watchedAt!.toLocaleString("pt-BR")}
              </>
            ) : null}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-start gap-3">
            <Button asChild>
              <a
                href={course.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Assistir na Cefis →
              </a>
            </Button>
            {!hasWatched ? (
              <MarkWatchedButton courseId={course.id} />
            ) : (
              <Button variant="outline" disabled>
                Vídeo assistido ✓
              </Button>
            )}
            {canTakeQuiz ? (
              <Button asChild>
                <Link href={`/cursos/${course.id}/quiz`}>Fazer quiz</Link>
              </Button>
            ) : (
              <Button disabled>Fazer quiz</Button>
            )}
          </div>
          {blockReason ? (
            <p className="text-sm text-muted-foreground">{blockReason}</p>
          ) : null}
        </CardContent>
      </Card>

      {attempts.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Histórico de tentativas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground">
                  <tr>
                    <th className="px-2 py-2">Tentativa</th>
                    <th className="px-2 py-2">Data</th>
                    <th className="px-2 py-2 text-right">Nota</th>
                    <th className="px-2 py-2">Resultado</th>
                  </tr>
                </thead>
                <tbody>
                  {attempts.map((a) => (
                    <tr key={a.id} className="border-t">
                      <td className="px-2 py-2">#{a.attemptNumber}</td>
                      <td className="px-2 py-2">
                        {(a.finishedAt ?? a.startedAt).toLocaleString("pt-BR")}
                      </td>
                      <td className="px-2 py-2 text-right">{a.score}%</td>
                      <td className="px-2 py-2">
                        {a.passed ? (
                          <Badge variant="success">Aprovado</Badge>
                        ) : (
                          <Badge variant="muted">Reprovado</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {enrollment.status === "COMPLETED" ? (
        <Card>
          <CardContent className="py-6">
            <p className="text-sm">
              Curso concluído.{" "}
              <Link
                href="/meus-certificados"
                className="text-primary underline-offset-4 hover:underline"
              >
                Ver meus certificados
              </Link>
              .
            </p>
          </CardContent>
        </Card>
      ) : null}
    </main>
  );
}

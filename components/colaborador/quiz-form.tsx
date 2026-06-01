"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { submitQuizAttempt } from "@/app/(colaborador)/cursos/[id]/quiz/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Question = {
  id: string;
  statement: string;
  answers: { id: string; text: string }[];
};

export function QuizForm({
  attemptId,
  courseId,
  questions,
}: {
  attemptId: string;
  courseId: string;
  questions: Question[];
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === questions.length;

  function setAnswer(qid: string, aid: string) {
    setAnswers((prev) => ({ ...prev, [qid]: aid }));
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!allAnswered) return;
    if (
      !window.confirm(
        "Enviar respostas? Não dá pra editar depois.",
      )
    ) {
      return;
    }
    setError(null);

    const responses = Object.entries(answers).map(([questionId, answerId]) => ({
      questionId,
      answerId,
    }));

    startTransition(async () => {
      const r = await submitQuizAttempt({ attemptId, responses });
      if (!r.ok) {
        setError(r.message);
        return;
      }
      router.push(`/cursos/${courseId}/quiz/resultado/${attemptId}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {questions.map((q, qIdx) => (
        <Card key={q.id}>
          <CardHeader>
            <CardTitle className="text-base font-medium leading-snug">
              {qIdx + 1}. {q.statement}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {q.answers.map((a) => (
                <label
                  key={a.id}
                  className="flex cursor-pointer items-start gap-3 rounded-md border p-3 hover:bg-accent"
                >
                  <input
                    type="radio"
                    name={`q-${q.id}`}
                    value={a.id}
                    checked={answers[q.id] === a.id}
                    onChange={() => setAnswer(q.id, a.id)}
                    className="mt-0.5 h-4 w-4 cursor-pointer accent-primary"
                  />
                  <span className="flex-1 text-sm">{a.text}</span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      <div className="sticky bottom-4 flex flex-wrap items-center justify-between gap-3 rounded-md border bg-background p-4 shadow-sm">
        <span className="text-sm text-muted-foreground">
          {answeredCount} de {questions.length} respondidas
        </span>
        <Button type="submit" disabled={!allAnswered || pending}>
          {pending ? "Enviando..." : "Enviar respostas"}
        </Button>
      </div>
    </form>
  );
}

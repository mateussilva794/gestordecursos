"use client";

import { useTransition } from "react";

import { deleteQuestion } from "@/app/(admin)/admin/cursos/[id]/perguntas/actions";
import { Button } from "@/components/ui/button";

export function DeleteQuestionButton({
  courseId,
  questionId,
}: {
  courseId: string;
  questionId: string;
}) {
  const [pending, startTransition] = useTransition();

  function onDelete() {
    if (
      !window.confirm(
        "Excluir esta pergunta? Esta ação não pode ser desfeita.",
      )
    ) {
      return;
    }
    startTransition(async () => {
      const result = await deleteQuestion(courseId, questionId);
      if (!result.ok) {
        window.alert(result.message);
      }
    });
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onDelete}
      disabled={pending}
      className="text-destructive hover:text-destructive"
    >
      {pending ? "..." : "Excluir"}
    </Button>
  );
}

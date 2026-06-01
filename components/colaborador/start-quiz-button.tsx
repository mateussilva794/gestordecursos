"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { startQuizAttempt } from "@/app/(colaborador)/cursos/[id]/quiz/actions";
import { Button } from "@/components/ui/button";

export function StartQuizButton({
  courseId,
  label = "Iniciar quiz",
}: {
  courseId: string;
  label?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onClick() {
    if (
      !window.confirm(
        "Iniciar a tentativa? Vai contar como uma das suas tentativas, mesmo se você fechar o browser antes de enviar.",
      )
    ) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const r = await startQuizAttempt(courseId);
      if (!r.ok) {
        setError(r.message);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <Button onClick={onClick} disabled={pending}>
        {pending ? "Iniciando..." : label}
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { abandonQuizAttempt } from "@/app/(colaborador)/cursos/[id]/quiz/actions";
import { Button } from "@/components/ui/button";

export function AbandonQuizButton({
  attemptId,
  courseId,
}: {
  attemptId: string;
  courseId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (
      !window.confirm(
        "Abandonar esta tentativa? Vai contar como reprovação.",
      )
    ) {
      return;
    }
    startTransition(async () => {
      const r = await abandonQuizAttempt(attemptId);
      if (!r.ok) {
        window.alert(r.message);
        return;
      }
      router.push(`/cursos/${courseId}`);
      router.refresh();
    });
  }

  return (
    <Button
      variant="outline"
      onClick={onClick}
      disabled={pending}
      className="text-destructive hover:text-destructive"
    >
      {pending ? "Abandonando..." : "Abandonar tentativa"}
    </Button>
  );
}

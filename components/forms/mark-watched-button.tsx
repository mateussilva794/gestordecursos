"use client";

import { useState, useTransition } from "react";

import { markAsWatched } from "@/app/(colaborador)/cursos/[id]/actions";
import { Button } from "@/components/ui/button";

export function MarkWatchedButton({ courseId }: { courseId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onClick() {
    if (!window.confirm("Confirmar que assistiu o vídeo na Cefis?")) return;
    setError(null);
    startTransition(async () => {
      const r = await markAsWatched(courseId);
      if (!r.ok) setError(r.message);
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <Button
        type="button"
        variant="outline"
        onClick={onClick}
        disabled={pending}
      >
        {pending ? "Salvando..." : "Marquei como assistido"}
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

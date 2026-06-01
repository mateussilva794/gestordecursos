"use client";

import Link from "next/link";
import { useTransition } from "react";

import { toggleCourseActive } from "@/app/(admin)/admin/cursos/actions";
import { Button } from "@/components/ui/button";

export function CourseRowActions({
  courseId,
  isActive,
}: {
  courseId: string;
  isActive: boolean;
}) {
  const [pending, startTransition] = useTransition();

  function onToggle() {
    startTransition(async () => {
      await toggleCourseActive(courseId);
    });
  }

  return (
    <div className="flex justify-end gap-1">
      <Button asChild variant="ghost" size="sm">
        <Link href={`/admin/cursos/${courseId}/editar`}>Editar</Link>
      </Button>
      <Button asChild variant="ghost" size="sm">
        <Link href={`/admin/cursos/${courseId}/perguntas`}>Perguntas</Link>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        disabled={pending}
        onClick={onToggle}
      >
        {pending ? "..." : isActive ? "Desativar" : "Ativar"}
      </Button>
    </div>
  );
}

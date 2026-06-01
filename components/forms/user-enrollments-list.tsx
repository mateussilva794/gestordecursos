"use client";

import { useState, useTransition } from "react";

import {
  enrollSingleUser,
  grantExtraAttempt,
  unenrollUser,
} from "@/app/(admin)/admin/matriculas/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type EnrollmentRow = {
  courseId: string;
  courseTitle: string;
  status: string;
  attemptsAllowed: number;
  attemptsUsed: number;
  courseActive: boolean;
};

type AvailableCourse = {
  id: string;
  title: string;
  workloadHours: number;
};

function statusBadge(status: string) {
  switch (status) {
    case "COMPLETED":
      return <Badge variant="success">Concluído</Badge>;
    case "IN_PROGRESS":
      return <Badge variant="secondary">Em andamento</Badge>;
    case "BLOCKED":
      return <Badge variant="destructive">Bloqueado</Badge>;
    case "NOT_STARTED":
    default:
      return <Badge variant="muted">Não iniciado</Badge>;
  }
}

export function UserEnrollmentsList({
  userId,
  enrollments,
  availableCourses,
}: {
  userId: string;
  enrollments: EnrollmentRow[];
  availableCourses: AvailableCourse[];
}) {
  const [selectedCourse, setSelectedCourse] = useState("");
  const [pendingAdd, startAdd] = useTransition();
  const [pendingRemove, startRemove] = useTransition();
  const [pendingGrant, startGrant] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleAdd() {
    if (!selectedCourse) return;
    setError(null);
    startAdd(async () => {
      const r = await enrollSingleUser(userId, selectedCourse);
      if (!r.ok) {
        setError(r.message);
        return;
      }
      setSelectedCourse("");
    });
  }

  function handleRemove(courseId: string) {
    if (!window.confirm("Remover esta matrícula?")) return;
    setError(null);
    startRemove(async () => {
      const r = await unenrollUser(userId, courseId);
      if (!r.ok) setError(r.message);
    });
  }

  function handleGrant(courseId: string) {
    setError(null);
    startGrant(async () => {
      const r = await grantExtraAttempt(userId, courseId);
      if (!r.ok) setError(r.message);
    });
  }

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-md border border-destructive/50 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {enrollments.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Este usuário ainda não tem matrículas.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-2 text-left">Curso</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-right">Tentativas</th>
                <th className="px-4 py-2 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.map((e) => (
                <tr key={e.courseId} className="border-t">
                  <td className="px-4 py-2">
                    {e.courseTitle}
                    {!e.courseActive ? (
                      <span className="ml-2 text-xs text-muted-foreground">
                        (curso inativo)
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-2">{statusBadge(e.status)}</td>
                  <td className="px-4 py-2 text-right">
                    {e.attemptsUsed} / {e.attemptsAllowed}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex justify-end gap-1">
                      {e.status === "BLOCKED" ||
                      e.attemptsUsed >= e.attemptsAllowed ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleGrant(e.courseId)}
                          disabled={pendingGrant}
                        >
                          {pendingGrant ? "..." : "Liberar tentativa"}
                        </Button>
                      ) : null}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemove(e.courseId)}
                        disabled={pendingRemove}
                        className="text-destructive hover:text-destructive"
                      >
                        Remover
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="space-y-2 rounded-md border p-4">
        <h3 className="text-sm font-medium">Matricular em novo curso</h3>
        {availableCourses.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Não há cursos ativos disponíveis (já está em todos, ou nenhum ativo
            cadastrado).
          </p>
        ) : (
          <div className="flex gap-2">
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="flex h-10 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Selecione um curso...</option>
              {availableCourses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} ({c.workloadHours}h)
                </option>
              ))}
            </select>
            <Button
              type="button"
              onClick={handleAdd}
              disabled={pendingAdd || !selectedCourse}
            >
              {pendingAdd ? "Matriculando..." : "Matricular"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

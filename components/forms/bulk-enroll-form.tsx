"use client";

import { useState, useTransition } from "react";

import {
  bulkEnrollUsers,
  previewBulkEnrollment,
} from "@/app/(admin)/admin/matriculas/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Course = { id: string; title: string; workloadHours: number };

type PreviewResult = {
  userCount: number;
  courseCount: number;
  newEnrollments: number;
  existingCount: number;
};

export function BulkEnrollForm({
  courses,
  departments,
}: {
  courses: Course[];
  departments: string[];
}) {
  const [courseIds, setCourseIds] = useState<string[]>([]);
  const [filterRole, setFilterRole] = useState("COLABORADOR");
  const [filterDepartment, setFilterDepartment] = useState("");
  const [onlyActive, setOnlyActive] = useState(true);

  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [applyResult, setApplyResult] = useState<{
    created: number;
    skipped: number;
  } | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [pendingPreview, startPreview] = useTransition();
  const [pendingApply, startApply] = useTransition();

  function toggleCourse(id: string) {
    setPreview(null);
    setApplyResult(null);
    setCourseIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function buildInput() {
    return {
      courseIds,
      filterRole,
      filterDepartment: filterDepartment.trim() || null,
      onlyActive,
    };
  }

  function onPreview() {
    setServerError(null);
    setApplyResult(null);
    startPreview(async () => {
      const r = await previewBulkEnrollment(buildInput());
      if (!r.ok) {
        setServerError(r.message);
        setPreview(null);
        return;
      }
      setPreview({
        userCount: r.userCount,
        courseCount: r.courseCount,
        newEnrollments: r.newEnrollments,
        existingCount: r.existingCount,
      });
    });
  }

  function onApply() {
    if (!preview || preview.newEnrollments === 0) return;
    if (
      !window.confirm(
        `Confirmar matrícula de ${preview.userCount} usuário(s) em ${preview.courseCount} curso(s)? ` +
          `${preview.newEnrollments} matrícula(s) nova(s) serão criadas (${preview.existingCount} já existentes serão ignoradas).`,
      )
    ) {
      return;
    }
    setServerError(null);
    startApply(async () => {
      const r = await bulkEnrollUsers(buildInput());
      if (!r.ok) {
        setServerError(r.message);
        return;
      }
      setApplyResult({ created: r.created, skipped: r.skipped });
      setPreview(null);
      setCourseIds([]);
    });
  }

  return (
    <div className="space-y-6">
      {serverError ? (
        <Alert variant="destructive">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      ) : null}
      {applyResult ? (
        <Alert>
          <AlertDescription>
            <strong>Matrículas aplicadas.</strong> Criadas: {applyResult.created}{" "}
            · Já existentes (puladas): {applyResult.skipped}.
          </AlertDescription>
        </Alert>
      ) : null}

      <section className="space-y-3">
        <Label>Cursos (selecione um ou mais)</Label>
        {courses.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum curso ativo encontrado. Cadastre cursos primeiro.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {courses.map((c) => (
              <label
                key={c.id}
                className="flex cursor-pointer items-start gap-2 rounded-md border p-3 hover:bg-accent"
              >
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 accent-primary"
                  checked={courseIds.includes(c.id)}
                  onChange={() => toggleCourse(c.id)}
                />
                <div className="flex-1">
                  <div className="font-medium">{c.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {c.workloadHours}h
                  </div>
                </div>
              </label>
            ))}
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="filter-role">Papel</Label>
          <select
            id="filter-role"
            value={filterRole}
            onChange={(e) => {
              setPreview(null);
              setFilterRole(e.target.value);
            }}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="COLABORADOR">Colaborador</option>
            <option value="RH">RH</option>
            <option value="ADMIN">Admin</option>
            <option value="ALL">Todos os papéis</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="filter-dept">Departamento</Label>
          <Input
            id="filter-dept"
            value={filterDepartment}
            onChange={(e) => {
              setPreview(null);
              setFilterDepartment(e.target.value);
            }}
            list="bulk-dept-suggestions"
            placeholder="(todos)"
          />
          <datalist id="bulk-dept-suggestions">
            {departments.map((d) => (
              <option key={d} value={d} />
            ))}
          </datalist>
        </div>
        <div className="flex items-end gap-2">
          <input
            id="filter-active"
            type="checkbox"
            className="h-4 w-4 accent-primary"
            checked={onlyActive}
            onChange={(e) => {
              setPreview(null);
              setOnlyActive(e.target.checked);
            }}
          />
          <Label htmlFor="filter-active" className="cursor-pointer">
            Apenas usuários ativos
          </Label>
        </div>
      </section>

      {preview ? (
        <Alert>
          <AlertDescription>
            <strong>Pré-visualização:</strong> {preview.userCount} usuário(s) ×{" "}
            {preview.courseCount} curso(s) ={" "}
            {preview.userCount * preview.courseCount} pares.{" "}
            <strong>{preview.newEnrollments}</strong> matrícula(s) nova(s) serão
            criadas ({preview.existingCount} já existentes serão ignoradas).
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onPreview}
          disabled={pendingPreview || courseIds.length === 0}
        >
          {pendingPreview ? "Calculando..." : "Pré-visualizar"}
        </Button>
        <Button
          type="button"
          onClick={onApply}
          disabled={
            pendingApply || !preview || preview.newEnrollments === 0
          }
        >
          {pendingApply ? "Aplicando..." : "Aplicar matrículas"}
        </Button>
      </div>
    </div>
  );
}

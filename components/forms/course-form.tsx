"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { createCourse, updateCourse } from "@/app/(admin)/admin/cursos/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { courseSchema, type CourseInput } from "@/lib/validators/course";

type CourseFormProps = {
  courseId?: string;
  initialData?: Partial<CourseInput>;
  categorySuggestions: string[];
};

const DEFAULT_VALUES: CourseInput = {
  title: "",
  description: "",
  category: "",
  workloadHours: 1,
  externalUrl: "",
  passingScore: 70,
  maxAttempts: 2,
  active: true,
};

export function CourseForm({
  courseId,
  initialData,
  categorySuggestions,
}: CourseFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const defaultValues: CourseInput = {
    ...DEFAULT_VALUES,
    ...initialData,
    category: initialData?.category ?? "",
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CourseInput>({
    resolver: zodResolver(courseSchema),
    defaultValues,
  });

  async function onSubmit(data: CourseInput) {
    setSubmitting(true);
    setServerError(null);
    const result = courseId
      ? await updateCourse(courseId, data)
      : await createCourse(data);
    setSubmitting(false);

    if (!result.ok) {
      setServerError(result.message);
      return;
    }

    if (!courseId && "id" in result) {
      router.push(`/admin/cursos/${result.id}/perguntas`);
    } else {
      router.push("/admin/cursos");
    }
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6"
      noValidate
    >
      {serverError ? (
        <Alert variant="destructive">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="title">Título</Label>
        <Input id="title" {...register("title")} />
        {errors.title ? (
          <p className="text-sm text-destructive">{errors.title.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea id="description" rows={4} {...register("description")} />
        {errors.description ? (
          <p className="text-sm text-destructive">
            {errors.description.message}
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="category">Categoria</Label>
          <Input
            id="category"
            list="category-suggestions"
            placeholder="Ex.: Tributário, Compliance..."
            {...register("category")}
          />
          <datalist id="category-suggestions">
            {categorySuggestions.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          {errors.category ? (
            <p className="text-sm text-destructive">
              {errors.category.message}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="workloadHours">Carga horária (horas)</Label>
          <Input
            id="workloadHours"
            type="number"
            min={1}
            {...register("workloadHours")}
          />
          {errors.workloadHours ? (
            <p className="text-sm text-destructive">
              {errors.workloadHours.message}
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="externalUrl">Link do curso na Cefis</Label>
        <Input
          id="externalUrl"
          type="url"
          placeholder="https://www.cefis.com.br/..."
          {...register("externalUrl")}
        />
        {errors.externalUrl ? (
          <p className="text-sm text-destructive">
            {errors.externalUrl.message}
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="passingScore">Nota mínima (%)</Label>
          <Input
            id="passingScore"
            type="number"
            min={0}
            max={100}
            {...register("passingScore")}
          />
          {errors.passingScore ? (
            <p className="text-sm text-destructive">
              {errors.passingScore.message}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="maxAttempts">Tentativas máximas</Label>
          <Input
            id="maxAttempts"
            type="number"
            min={1}
            max={20}
            {...register("maxAttempts")}
          />
          {errors.maxAttempts ? (
            <p className="text-sm text-destructive">
              {errors.maxAttempts.message}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="active"
          type="checkbox"
          className="h-4 w-4 cursor-pointer accent-primary"
          {...register("active")}
        />
        <Label htmlFor="active" className="cursor-pointer">
          Curso ativo (visível para colaboradores)
        </Label>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting
            ? "Salvando..."
            : courseId
              ? "Salvar alterações"
              : "Criar curso"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}

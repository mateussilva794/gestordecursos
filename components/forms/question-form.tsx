"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";

import {
  createQuestion,
  updateQuestion,
} from "@/app/(admin)/admin/cursos/[id]/perguntas/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  questionSchema,
  type QuestionInput,
} from "@/lib/validators/course";

type QuestionFormProps = {
  courseId: string;
  questionId?: string;
  initialData: QuestionInput;
};

export function QuestionForm({
  courseId,
  questionId,
  initialData,
}: QuestionFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<QuestionInput>({
    resolver: zodResolver(questionSchema),
    defaultValues: initialData,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "answers",
  });

  const watchedAnswers = watch("answers") ?? [];
  const correctIndex = watchedAnswers.findIndex((a) => a?.isCorrect);

  function markCorrect(index: number) {
    watchedAnswers.forEach((_, i) => {
      setValue(`answers.${i}.isCorrect`, i === index, { shouldDirty: true });
    });
  }

  async function onSubmit(data: QuestionInput) {
    setSubmitting(true);
    setServerError(null);
    const result = questionId
      ? await updateQuestion(courseId, questionId, data)
      : await createQuestion(courseId, data);
    setSubmitting(false);

    if (!result.ok) {
      setServerError(result.message);
      return;
    }

    router.push(`/admin/cursos/${courseId}/perguntas`);
    router.refresh();
  }

  // Erro a nível do array (refine "exatamente 1 correta", min/max)
  const answersRootError =
    errors.answers && typeof (errors.answers as { message?: string }).message === "string"
      ? (errors.answers as { message?: string }).message
      : undefined;

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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_120px]">
        <div className="space-y-2">
          <Label htmlFor="statement">Enunciado</Label>
          <Textarea id="statement" rows={3} {...register("statement")} />
          {errors.statement ? (
            <p className="text-sm text-destructive">
              {errors.statement.message}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="order">Ordem</Label>
          <Input
            id="order"
            type="number"
            min={1}
            {...register("order")}
          />
          {errors.order ? (
            <p className="text-sm text-destructive">{errors.order.message}</p>
          ) : null}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Alternativas</Label>
          {fields.length < 6 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ text: "", isCorrect: false })}
            >
              Adicionar alternativa
            </Button>
          ) : null}
        </div>
        {answersRootError ? (
          <Alert variant="destructive">
            <AlertDescription>{answersRootError}</AlertDescription>
          </Alert>
        ) : null}
        <div className="space-y-3">
          {fields.map((field, index) => (
            <div key={field.id} className="rounded-md border p-3">
              <div className="flex items-start gap-3">
                <div className="pt-7">
                  <input
                    type="radio"
                    name="correct-answer"
                    checked={correctIndex === index}
                    onChange={() => markCorrect(index)}
                    className="h-4 w-4 cursor-pointer accent-primary"
                    aria-label={`Marcar alternativa ${index + 1} como correta`}
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <Label
                    htmlFor={`answer-${index}`}
                    className="text-xs uppercase text-muted-foreground"
                  >
                    Alternativa {index + 1}
                    {correctIndex === index ? " · correta" : ""}
                  </Label>
                  <Input
                    id={`answer-${index}`}
                    {...register(`answers.${index}.text`)}
                  />
                  {errors.answers?.[index]?.text ? (
                    <p className="text-sm text-destructive">
                      {errors.answers[index]?.text?.message}
                    </p>
                  ) : null}
                </div>
                {fields.length > 2 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                  >
                    Remover
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting
            ? "Salvando..."
            : questionId
              ? "Salvar alterações"
              : "Criar pergunta"}
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

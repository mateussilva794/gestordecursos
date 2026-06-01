import { z } from "zod";

export const courseSchema = z.object({
  title: z.string().trim().min(3, "Título mínimo 3 caracteres.").max(200),
  description: z
    .string()
    .trim()
    .min(10, "Descrição mínima 10 caracteres.")
    .max(5000),
  category: z.string().trim().max(80).optional().nullable(),
  workloadHours: z.coerce
    .number()
    .int("Carga horária deve ser inteira.")
    .min(1, "Carga horária mínima 1h.")
    .max(500, "Carga horária máxima 500h."),
  externalUrl: z
    .string()
    .url("Informe uma URL válida (https://...)."),
  passingScore: z.coerce
    .number()
    .int()
    .min(0, "Nota mínima entre 0 e 100.")
    .max(100, "Nota mínima entre 0 e 100."),
  maxAttempts: z.coerce
    .number()
    .int()
    .min(1, "Tentativas máximas mínima 1.")
    .max(20, "Tentativas máximas máxima 20."),
  active: z.coerce.boolean(),
});

export type CourseInput = z.infer<typeof courseSchema>;

export const questionSchema = z.object({
  statement: z
    .string()
    .trim()
    .min(5, "Enunciado mínimo 5 caracteres.")
    .max(2000),
  order: z.coerce
    .number()
    .int("Ordem deve ser inteira.")
    .min(1, "Ordem mínima 1."),
  answers: z
    .array(
      z.object({
        text: z
          .string()
          .trim()
          .min(1, "Alternativa não pode ficar em branco.")
          .max(500),
        isCorrect: z.coerce.boolean(),
      }),
    )
    .min(2, "Mínimo 2 alternativas.")
    .max(6, "Máximo 6 alternativas.")
    .refine(
      (arr) => arr.filter((a) => a.isCorrect).length === 1,
      "Marque exatamente uma alternativa como correta.",
    ),
});

export type QuestionInput = z.infer<typeof questionSchema>;

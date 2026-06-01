import { z } from "zod";

export const quizSubmitSchema = z.object({
  attemptId: z.string().min(1, "Tentativa inválida."),
  responses: z
    .array(
      z.object({
        questionId: z.string().min(1),
        answerId: z.string().min(1),
      }),
    )
    .min(1, "Responda todas as perguntas."),
});

export type QuizSubmitInput = z.infer<typeof quizSubmitSchema>;

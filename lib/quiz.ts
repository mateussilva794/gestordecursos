import { db } from "@/lib/db";

// PRNG determinístico (mulberry32). Seed → função pura.
function mulberry32(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return h;
}

export function seededShuffle<T>(items: T[], seed: string): T[] {
  const rand = mulberry32(hashSeed(seed));
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = tmp;
  }
  return arr;
}

export type QuizQuestion = {
  id: string;
  statement: string;
  answers: { id: string; text: string }[];
};

// Carrega perguntas embaralhadas para uma tentativa específica.
// NUNCA inclui o campo isCorrect — esse campo jamais sai do servidor durante uma tentativa em curso.
export async function getQuizForAttempt(
  attemptId: string,
  courseId: string,
): Promise<QuizQuestion[]> {
  const questions = await db.question.findMany({
    where: { courseId },
    include: {
      answers: { select: { id: true, text: true, order: true } },
    },
    orderBy: { order: "asc" },
  });
  const shuffledQuestions = seededShuffle(questions, attemptId);
  return shuffledQuestions.map((q) => ({
    id: q.id,
    statement: q.statement,
    answers: seededShuffle(
      q.answers.map((a) => ({ id: a.id, text: a.text })),
      `${attemptId}:${q.id}`,
    ),
  }));
}

// Para a página de resultado: carrega tentativa + matrícula + respostas dadas.
export async function getAttemptWithGrading(attemptId: string) {
  return db.quizAttempt.findUnique({
    where: { id: attemptId },
    include: {
      enrollment: {
        include: { course: true },
      },
      responses: true,
    },
  });
}

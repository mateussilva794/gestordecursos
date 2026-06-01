import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import { db } from "@/lib/db";
import { generateCertificatePdf } from "@/lib/pdf";

const STORAGE_DIR = path.join(process.cwd(), "storage", "certificates");

type EnsureInput = {
  userId: string;
  courseId: string;
  attemptId: string;
};

// Cria a row de Certificate (com snapshots) para uma tentativa aprovada.
// Idempotente: se já existir para esse attemptId, retorna a existente.
// O PDF NÃO é gerado aqui — fica para a primeira requisição de download.
export async function ensureCertificateForAttempt(input: EnsureInput) {
  const existing = await db.certificate.findUnique({
    where: { attemptId: input.attemptId },
  });
  if (existing) return existing;

  const [user, course, attempt] = await Promise.all([
    db.user.findUniqueOrThrow({ where: { id: input.userId } }),
    db.course.findUniqueOrThrow({ where: { id: input.courseId } }),
    db.quizAttempt.findUniqueOrThrow({ where: { id: input.attemptId } }),
  ]);

  if (!attempt.passed) {
    throw new Error(
      "Tentativa não foi aprovada — não é possível emitir certificado.",
    );
  }

  return db.certificate.create({
    data: {
      userId: input.userId,
      courseId: input.courseId,
      attemptId: input.attemptId,
      userNameSnapshot: user.name,
      userCpfSnapshot: user.cpf,
      courseTitleSnapshot: course.title,
      courseDescriptionSnapshot: course.description,
      workloadHoursSnapshot: course.workloadHours,
      scoreSnapshot: attempt.score,
      pdfPath: "",
      pdfHash: "",
    },
  });
}

// Backfill: para todos os enrollments COMPLETED de um usuário sem Certificate,
// cria a row. Usado na página /meus-certificados para suportar enrollments
// concluídos antes da Fase 7.
export async function backfillCertificatesForUser(userId: string) {
  const completed = await db.courseEnrollment.findMany({
    where: { userId, status: "COMPLETED" },
    include: {
      attempts: {
        where: { passed: true },
        orderBy: { finishedAt: "desc" },
        take: 1,
      },
    },
  });

  for (const enrollment of completed) {
    const passed = enrollment.attempts[0];
    if (!passed) continue;
    await ensureCertificateForAttempt({
      userId: enrollment.userId,
      courseId: enrollment.courseId,
      attemptId: passed.id,
    });
  }
}

// Gera (se necessário), salva no storage e retorna o conteúdo do PDF + hash.
// Atualiza pdfHash e pdfPath na row do Certificate na primeira geração.
export async function loadOrGenerateCertificatePdf(certificateId: string): Promise<{
  buffer: Buffer;
  certificate: { id: string; validationCode: string };
}> {
  const certificate = await db.certificate.findUniqueOrThrow({
    where: { id: certificateId },
  });

  const filePath = path.join(STORAGE_DIR, `${certificate.id}.pdf`);

  try {
    const buffer = await fs.readFile(filePath);
    return { buffer, certificate };
  } catch {
    // Não existe — gera, salva, atualiza hash
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const buffer = await generateCertificatePdf({
    userName: certificate.userNameSnapshot,
    userCpf: certificate.userCpfSnapshot,
    courseTitle: certificate.courseTitleSnapshot,
    courseDescription: certificate.courseDescriptionSnapshot,
    workloadHours: certificate.workloadHoursSnapshot,
    score: certificate.scoreSnapshot,
    issuedAt: certificate.issuedAt,
    validationCode: certificate.validationCode,
    validationUrl: `${baseUrl}/validar/${certificate.validationCode}`,
  });

  await fs.mkdir(STORAGE_DIR, { recursive: true });
  await fs.writeFile(filePath, buffer);

  const hash = crypto.createHash("sha256").update(buffer).digest("hex");
  await db.certificate.update({
    where: { id: certificate.id },
    data: {
      pdfHash: hash,
      pdfPath: `storage/certificates/${certificate.id}.pdf`,
    },
  });

  return { buffer, certificate };
}

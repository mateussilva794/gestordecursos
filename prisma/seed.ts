/**
 * Seed do banco — popula dados de teste para desenvolvimento.
 *
 * - Idempotente: usa upsert sempre que possível.
 * - Senhas conhecidas, dev apenas. NUNCA rodar em produção.
 * - Para reset completo dos dados: `pnpm db:reset` (zera + reaplica migrations + roda seed).
 */

import { EnrollmentStatus, PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = "Senha123!";
const BCRYPT_COST = 10;

type AnswerInput = { text: string; isCorrect: boolean };
type QuestionInput = { statement: string; answers: AnswerInput[] };
type CourseInput = {
  title: string;
  description: string;
  category: string;
  workloadHours: number;
  externalUrl: string;
  questions: QuestionInput[];
};

async function main() {
  console.log("[seed] Iniciando seed do banco...");

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, BCRYPT_COST);

  // ---------------- Usuários ----------------
  const admin = await prisma.user.upsert({
    where: { email: "admin@dacto.com.br" },
    update: {},
    create: {
      name: "Administrador do Sistema",
      email: "admin@dacto.com.br",
      passwordHash,
      role: Role.ADMIN,
      department: "TI",
      position: "Administrador",
    },
  });

  const rh = await prisma.user.upsert({
    where: { email: "rh@dacto.com.br" },
    update: {},
    create: {
      name: "Recursos Humanos",
      email: "rh@dacto.com.br",
      passwordHash,
      role: Role.RH,
      department: "RH",
      position: "Analista de RH",
    },
  });

  const colaboradoresData = [
    { name: "Ana Souza",     email: "colaborador1@dacto.com.br", department: "Contábil",       position: "Assistente Contábil" },
    { name: "Bruno Pereira", email: "colaborador2@dacto.com.br", department: "Fiscal",         position: "Analista Fiscal" },
    { name: "Carla Lima",    email: "colaborador3@dacto.com.br", department: "Folha",          position: "Analista de Folha" },
    { name: "Diego Martins", email: "colaborador4@dacto.com.br", department: "DP",             position: "Analista de DP" },
    { name: "Elena Ribeiro", email: "colaborador5@dacto.com.br", department: "Administrativo", position: "Assistente Administrativo" },
  ];

  const colaboradores = await Promise.all(
    colaboradoresData.map((data) =>
      prisma.user.upsert({
        where: { email: data.email },
        update: {},
        create: { ...data, passwordHash, role: Role.COLABORADOR },
      }),
    ),
  );

  console.log(`[seed] Usuários: 1 ADMIN, 1 RH, ${colaboradores.length} COLABORADORES.`);

  // ---------------- Cursos + perguntas + alternativas ----------------
  const coursesData: CourseInput[] = [
    {
      title: "Reforma Tributária 2026 — Visão Geral",
      description:
        "Visão geral das mudanças trazidas pela reforma tributária brasileira e seus impactos no dia a dia do escritório contábil.",
      category: "Tributário",
      workloadHours: 4,
      externalUrl: "https://www.cefis.com.br/curso/reforma-tributaria",
      questions: [
        {
          statement: "Qual tributo federal foi unificado pela CBS na reforma tributária?",
          answers: [
            { text: "PIS e COFINS", isCorrect: true },
            { text: "IRPJ e CSLL", isCorrect: false },
            { text: "ICMS e ISS", isCorrect: false },
            { text: "IPI e II", isCorrect: false },
          ],
        },
        {
          statement: "O IBS substitui quais tributos?",
          answers: [
            { text: "ICMS e ISS", isCorrect: true },
            { text: "PIS e COFINS", isCorrect: false },
            { text: "IRPJ e CSLL", isCorrect: false },
            { text: "IOF e IPI", isCorrect: false },
          ],
        },
        {
          statement: "Qual é o princípio fundamental do novo modelo tributário?",
          answers: [
            { text: "Tributação no destino", isCorrect: true },
            { text: "Tributação na origem", isCorrect: false },
            { text: "Tributação progressiva por região", isCorrect: false },
            { text: "Tributação por fluxo de caixa", isCorrect: false },
          ],
        },
        {
          statement: "Qual é o período de transição previsto para a reforma?",
          answers: [
            { text: "2026 a 2032", isCorrect: false },
            { text: "2026 a 2033", isCorrect: true },
            { text: "2025 a 2030", isCorrect: false },
            { text: "Sem período de transição", isCorrect: false },
          ],
        },
        {
          statement: "O Imposto Seletivo (IS) incidirá sobre:",
          answers: [
            { text: "Produtos prejudiciais à saúde e ao meio ambiente", isCorrect: true },
            { text: "Todos os bens e serviços", isCorrect: false },
            { text: "Apenas produtos importados", isCorrect: false },
            { text: "Serviços financeiros", isCorrect: false },
          ],
        },
      ],
    },
    {
      title: "LGPD para Escritórios Contábeis",
      description:
        "Fundamentos da Lei Geral de Proteção de Dados aplicados à rotina de escritórios contábeis, com foco em dados de clientes e colaboradores.",
      category: "Compliance",
      workloadHours: 2,
      externalUrl: "https://www.cefis.com.br/curso/lgpd-contabilidade",
      questions: [
        {
          statement: "Quem é o controlador de dados na LGPD?",
          answers: [
            { text: "Quem decide sobre o tratamento dos dados pessoais", isCorrect: true },
            { text: "Quem executa o tratamento por conta do controlador", isCorrect: false },
            { text: "O titular dos dados", isCorrect: false },
            { text: "A Autoridade Nacional de Proteção de Dados", isCorrect: false },
          ],
        },
        {
          statement: "Qual é a base legal mais comum para tratar dados de funcionários?",
          answers: [
            { text: "Execução de contrato e obrigação legal", isCorrect: true },
            { text: "Consentimento explícito sempre obrigatório", isCorrect: false },
            { text: "Legítimo interesse exclusivamente", isCorrect: false },
            { text: "Não há base legal aplicável", isCorrect: false },
          ],
        },
        {
          statement: "Sobre incidentes de segurança relevantes, o controlador deve:",
          answers: [
            { text: "Comunicar a ANPD e o titular em prazo razoável", isCorrect: true },
            { text: "Manter sigilo absoluto do incidente", isCorrect: false },
            { text: "Comunicar apenas a polícia civil", isCorrect: false },
            { text: "Não há obrigação de comunicar", isCorrect: false },
          ],
        },
        {
          statement: "Qual direito NÃO é garantido ao titular pela LGPD?",
          answers: [
            { text: "Receber indenização automática por qualquer tratamento", isCorrect: true },
            { text: "Acesso aos dados", isCorrect: false },
            { text: "Correção de dados incompletos", isCorrect: false },
            { text: "Anonimização ou eliminação de dados desnecessários", isCorrect: false },
          ],
        },
        {
          statement: "O encarregado pelo tratamento de dados (DPO) deve ser:",
          answers: [
            { text: "Indicado pelo controlador e ter contato divulgado", isCorrect: true },
            { text: "Funcionário CLT obrigatoriamente", isCorrect: false },
            { text: "Membro do conselho da ANPD", isCorrect: false },
            { text: "Mantido em sigilo, sem divulgação", isCorrect: false },
          ],
        },
      ],
    },
  ];

  const createdCourses: Array<{ id: string; maxAttempts: number }> = [];

  for (const courseData of coursesData) {
    // Não há unique no `title`, então uso findFirst + create/update manual.
    const existing = await prisma.course.findFirst({ where: { title: courseData.title } });

    const course = existing
      ? await prisma.course.update({
          where: { id: existing.id },
          data: {
            description: courseData.description,
            category: courseData.category,
            workloadHours: courseData.workloadHours,
            externalUrl: courseData.externalUrl,
            createdById: admin.id,
          },
        })
      : await prisma.course.create({
          data: {
            title: courseData.title,
            description: courseData.description,
            category: courseData.category,
            workloadHours: courseData.workloadHours,
            externalUrl: courseData.externalUrl,
            createdById: admin.id,
          },
        });

    // Reset perguntas/alternativas no reseed para evitar duplicação.
    // Cascade derruba Answer junto com Question.
    await prisma.question.deleteMany({ where: { courseId: course.id } });

    for (const [idx, q] of courseData.questions.entries()) {
      await prisma.question.create({
        data: {
          courseId: course.id,
          statement: q.statement,
          order: idx + 1,
          answers: {
            create: q.answers.map((a, ai) => ({
              text: a.text,
              isCorrect: a.isCorrect,
              order: ai + 1,
            })),
          },
        },
      });
    }

    createdCourses.push({ id: course.id, maxAttempts: course.maxAttempts });
  }

  console.log(`[seed] Cursos: ${createdCourses.length} (com perguntas e alternativas).`);

  // ---------------- Matrículas ----------------
  let enrollmentsCount = 0;
  for (const colaborador of colaboradores) {
    for (const course of createdCourses) {
      await prisma.courseEnrollment.upsert({
        where: { userId_courseId: { userId: colaborador.id, courseId: course.id } },
        update: {},
        create: {
          userId: colaborador.id,
          courseId: course.id,
          status: EnrollmentStatus.NOT_STARTED,
          attemptsAllowed: course.maxAttempts,
          assignedById: rh.id,
        },
      });
      enrollmentsCount++;
    }
  }

  console.log(`[seed] Matrículas: ${enrollmentsCount}.`);

  // ---------------- Resumo ----------------
  console.log("");
  console.log("===========================================================");
  console.log("[seed] Concluído com sucesso.");
  console.log("[seed] Senha padrão (DEV apenas): " + DEFAULT_PASSWORD);
  console.log("[seed] Usuários para login:");
  console.log("  - admin@dacto.com.br        (ADMIN)");
  console.log("  - rh@dacto.com.br           (RH)");
  console.log("  - colaborador1..5@dacto.com.br (COLABORADOR)");
  console.log("===========================================================");
}

main()
  .catch((error) => {
    console.error("[seed] Falha:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

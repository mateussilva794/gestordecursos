import Link from "next/link";
import { getServerSession } from "next-auth";

import { CourseCard } from "@/components/colaborador/course-card";
import { Card, CardContent } from "@/components/ui/card";
import { authOptions } from "@/lib/auth";
import { getMyEnrollments } from "@/lib/enrollments";
import { hasRole } from "@/lib/roles";

export const metadata = { title: "Meu painel" };

function firstName(name: string) {
  const trimmed = name.trim();
  if (trimmed === "") return "colaborador";
  return trimmed.split(" ")[0] ?? trimmed;
}

type Enrollments = Awaited<ReturnType<typeof getMyEnrollments>>;

function Section({
  title,
  items,
  empty,
}: {
  title: string;
  items: Enrollments;
  empty: string;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">
        {title}{" "}
        <span className="text-sm font-normal text-muted-foreground">
          ({items.length})
        </span>
      </h2>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((e) => (
            <CourseCard
              key={e.id}
              courseId={e.courseId}
              title={e.course.title}
              category={e.course.category}
              workloadHours={e.course.workloadHours}
              status={e.status}
              courseActive={e.course.active}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const enrollments = await getMyEnrollments(session.user.id);

  const inProgress = enrollments.filter((e) => e.status === "IN_PROGRESS");
  const notStarted = enrollments.filter((e) => e.status === "NOT_STARTED");
  const completed = enrollments.filter((e) => e.status === "COMPLETED");
  const blocked = enrollments.filter((e) => e.status === "BLOCKED");

  const isStaff = hasRole(session.user.role, "RH");

  return (
    <main className="container mx-auto space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Olá, {firstName(session.user.name ?? "")}
        </h1>
        <p className="text-muted-foreground">
          {enrollments.length === 0
            ? "Você ainda não tem cursos atribuídos."
            : `Você tem ${enrollments.length} curso(s) atribuído(s).`}
        </p>
      </div>

      {enrollments.length === 0 && isStaff ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="mb-3 text-muted-foreground">
              Você é {session.user.role}. Sem matrículas, mas pode acessar a
              área administrativa:
            </p>
            <Link
              href="/admin"
              className="text-primary underline-offset-4 hover:underline"
            >
              Ir para o painel administrativo →
            </Link>
          </CardContent>
        </Card>
      ) : null}

      <Section
        title="Em andamento"
        items={inProgress}
        empty="Nenhum curso em andamento."
      />
      <Section
        title="Não iniciados"
        items={notStarted}
        empty={enrollments.length === 0 ? "—" : "Tudo iniciado!"}
      />
      <Section
        title="Concluídos"
        items={completed}
        empty="Você ainda não concluiu nenhum curso."
      />
      {blocked.length > 0 ? (
        <Section
          title="Bloqueados (tentativas esgotadas)"
          items={blocked}
          empty=""
        />
      ) : null}
    </main>
  );
}

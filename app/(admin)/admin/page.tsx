import Link from "next/link";
import { getServerSession } from "next-auth";

import { LogoutButton } from "@/components/forms/logout-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authOptions } from "@/lib/auth";
import { hasRole } from "@/lib/roles";

export const metadata = {
  title: "Painel administrativo",
};

type AdminCardProps = {
  href: string;
  title: string;
  description: string;
};

function AdminCard({ href, title, description }: AdminCardProps) {
  return (
    <Link href={href} className="block">
      <Card className="h-full transition-colors hover:bg-accent">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}

export default async function AdminHubPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  const isAdmin = hasRole(session.user.role, "ADMIN");

  return (
    <main className="container mx-auto p-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Painel administrativo
          </h1>
          <p className="text-muted-foreground">
            Logado como {session.user.name} ({session.user.role}).
          </p>
        </div>
        <LogoutButton />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <AdminCard
          href="/admin/cursos"
          title="Cursos"
          description="CRUD de cursos, perguntas e alternativas."
        />
        {isAdmin ? (
          <AdminCard
            href="/admin/usuarios"
            title="Usuários"
            description="Gestão de colaboradores, importação CSV e LGPD (ADMIN)."
          />
        ) : null}
        <AdminCard
          href="/admin/matriculas"
          title="Matrículas"
          description="Atribuir cursos a colaboradores (individual ou em massa)."
        />
        <AdminCard
          href="/admin/relatorios"
          title="Relatórios"
          description="Taxa de conclusão, ranking, certificados e exportação CSV."
        />
        {isAdmin ? (
          <AdminCard
            href="/admin/auditoria"
            title="Auditoria"
            description="Histórico completo de eventos (logins, alterações, downloads)."
          />
        ) : null}
      </div>
    </main>
  );
}

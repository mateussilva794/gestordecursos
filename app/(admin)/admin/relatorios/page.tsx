import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = { title: "Relatórios — Administração" };

type ReportCardProps = {
  href: string;
  title: string;
  description: string;
};

function ReportCard({ href, title, description }: ReportCardProps) {
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

export default function ReportsHubPage() {
  return (
    <main className="container mx-auto space-y-6 p-8">
      <div>
        <Link
          href="/admin"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Painel
        </Link>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Relatórios</h1>
        <p className="text-muted-foreground">
          Visões agregadas com exportação em CSV.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <ReportCard
          href="/admin/relatorios/cursos"
          title="Cursos"
          description="Taxa de conclusão e distribuição de status por curso."
        />
        <ReportCard
          href="/admin/relatorios/colaboradores"
          title="Colaboradores"
          description="Ranking por conclusões, nota média e cursos atribuídos."
        />
        <ReportCard
          href="/admin/relatorios/certificados"
          title="Certificados emitidos"
          description="Lista de todos os certificados, com código de validação."
        />
        <ReportCard
          href="/admin/relatorios/tentativas"
          title="Tentativas"
          description="Histórico detalhado das tentativas finalizadas."
        />
      </div>
    </main>
  );
}

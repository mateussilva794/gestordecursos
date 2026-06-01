import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCourseCompletionStats } from "@/lib/reports";

export const metadata = { title: "Relatório de cursos" };

export default async function CoursesReportPage() {
  const stats = await getCourseCompletionStats();

  return (
    <main className="container mx-auto space-y-6 p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/admin/relatorios"
            className="text-sm text-muted-foreground hover:underline"
          >
            ← Relatórios
          </Link>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Taxa de conclusão por curso
          </h1>
          <p className="text-muted-foreground">
            {stats.length} curso(s) cadastrado(s).
          </p>
        </div>
        <Button asChild>
          <a href="/api/admin/relatorios/cursos/csv">Exportar CSV</a>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Curso</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Carga</TableHead>
                <TableHead className="text-right">Matrículas</TableHead>
                <TableHead className="text-right">Concluídos</TableHead>
                <TableHead className="text-right">Em andamento</TableHead>
                <TableHead className="text-right">Bloqueados</TableHead>
                <TableHead className="w-48">Taxa de conclusão</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="py-8 text-center text-muted-foreground"
                  >
                    Sem cursos cadastrados.
                  </TableCell>
                </TableRow>
              ) : null}
              {stats.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <Link
                      href={`/admin/cursos/${s.id}/editar`}
                      className="font-medium hover:underline"
                    >
                      {s.title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {s.category ?? "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {s.workloadHours}h
                  </TableCell>
                  <TableCell className="text-right">{s.total}</TableCell>
                  <TableCell className="text-right">{s.completed}</TableCell>
                  <TableCell className="text-right">{s.inProgress}</TableCell>
                  <TableCell className="text-right">{s.blocked}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full bg-emerald-600 transition-all"
                          style={{ width: `${s.completionRate}%` }}
                        />
                      </div>
                      <span className="w-12 text-right text-xs tabular-nums">
                        {s.completionRate}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {s.active ? (
                      <Badge variant="success">Ativo</Badge>
                    ) : (
                      <Badge variant="muted">Inativo</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}

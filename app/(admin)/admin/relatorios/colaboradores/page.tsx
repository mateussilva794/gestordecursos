import Link from "next/link";

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
import { getCollaboratorRanking } from "@/lib/reports";

export const metadata = { title: "Relatório de colaboradores" };

export default async function CollaboratorsReportPage() {
  const ranking = await getCollaboratorRanking();

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
            Ranking de colaboradores
          </h1>
          <p className="text-muted-foreground">
            {ranking.length} colaborador(es) ativo(s).
          </p>
        </div>
        <Button asChild>
          <a href="/api/admin/relatorios/colaboradores/csv">Exportar CSV</a>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-right">#</TableHead>
                <TableHead>Colaborador</TableHead>
                <TableHead>Departamento</TableHead>
                <TableHead className="text-right">Matrículas</TableHead>
                <TableHead className="text-right">Concluídos</TableHead>
                <TableHead className="w-40">Taxa</TableHead>
                <TableHead className="text-right">Nota média</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ranking.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-8 text-center text-muted-foreground"
                  >
                    Sem colaboradores ativos.
                  </TableCell>
                </TableRow>
              ) : null}
              {ranking.map((u, idx) => (
                <TableRow key={u.id}>
                  <TableCell className="text-right text-muted-foreground">
                    {idx + 1}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/usuarios/${u.id}/editar`}
                      className="font-medium hover:underline"
                    >
                      {u.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {u.email}
                    </p>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {u.department ?? "—"}
                  </TableCell>
                  <TableCell className="text-right">{u.total}</TableCell>
                  <TableCell className="text-right">{u.completed}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full bg-emerald-600 transition-all"
                          style={{ width: `${u.completionRate}%` }}
                        />
                      </div>
                      <span className="w-12 text-right text-xs tabular-nums">
                        {u.completionRate}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {u.avgScore !== null ? `${u.avgScore}%` : "—"}
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

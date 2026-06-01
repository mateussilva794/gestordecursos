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
import { listFinishedAttempts } from "@/lib/reports";

export const metadata = { title: "Tentativas" };

export default async function AttemptsReportPage() {
  const attempts = await listFinishedAttempts(500);

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
            Histórico de tentativas
          </h1>
          <p className="text-muted-foreground">
            {attempts.length === 500
              ? "Exibindo as 500 mais recentes."
              : `${attempts.length} tentativa(s) finalizada(s).`}
          </p>
        </div>
        <Button asChild>
          <a href="/api/admin/relatorios/tentativas/csv">Exportar CSV</a>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Finalizada em</TableHead>
                <TableHead>Colaborador</TableHead>
                <TableHead>Curso</TableHead>
                <TableHead className="text-right">#</TableHead>
                <TableHead className="text-right">Nota</TableHead>
                <TableHead className="text-right">Mín.</TableHead>
                <TableHead>Resultado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attempts.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-8 text-center text-muted-foreground"
                  >
                    Nenhuma tentativa finalizada ainda.
                  </TableCell>
                </TableRow>
              ) : null}
              {attempts.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="text-sm">
                    {a.finishedAt
                      ? a.finishedAt.toLocaleString("pt-BR")
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{a.enrollment.user.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.enrollment.user.email}
                    </p>
                  </TableCell>
                  <TableCell>{a.enrollment.course.title}</TableCell>
                  <TableCell className="text-right">
                    {a.attemptNumber}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {a.score}%
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {a.enrollment.course.passingScore}%
                  </TableCell>
                  <TableCell>
                    {a.passed ? (
                      <Badge variant="success">Aprovado</Badge>
                    ) : (
                      <Badge variant="muted">Reprovado</Badge>
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

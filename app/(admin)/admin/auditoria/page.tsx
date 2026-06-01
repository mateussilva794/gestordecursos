import Link from "next/link";

import { AuditFilters } from "@/components/forms/audit-filters";
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
import { listAuditLogs, listDistinctAuditActions } from "@/lib/audit-query";

export const metadata = { title: "Auditoria — Administração" };

type SearchParams = {
  acao?: string;
  email?: string;
  entidade?: string;
  de?: string;
  ate?: string;
  page?: string;
};

function parseDate(value?: string): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function pageHref(searchParams: SearchParams, page: number): string {
  const params = new URLSearchParams();
  if (searchParams.acao) params.set("acao", searchParams.acao);
  if (searchParams.email) params.set("email", searchParams.email);
  if (searchParams.entidade) params.set("entidade", searchParams.entidade);
  if (searchParams.de) params.set("de", searchParams.de);
  if (searchParams.ate) params.set("ate", searchParams.ate);
  params.set("page", String(page));
  return `/admin/auditoria?${params.toString()}`;
}

export default async function AuditPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);

  const startDate = parseDate(searchParams.de);
  let endDate = parseDate(searchParams.ate);
  if (endDate) {
    // inclui o dia inteiro do ate
    endDate.setHours(23, 59, 59, 999);
  }

  const [{ items, total, totalPages }, actions] = await Promise.all([
    listAuditLogs({
      action: searchParams.acao,
      userEmail: searchParams.email,
      entity: searchParams.entidade,
      startDate,
      endDate,
      page,
    }),
    listDistinctAuditActions(),
  ]);

  return (
    <main className="container mx-auto space-y-6 p-8">
      <div>
        <Link
          href="/admin"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Painel
        </Link>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Auditoria</h1>
        <p className="text-muted-foreground">
          {total} evento(s) registrado(s). Visível apenas para ADMIN.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <AuditFilters
            actions={actions}
            defaultValues={{
              acao: searchParams.acao,
              email: searchParams.email,
              entidade: searchParams.entidade,
              de: searchParams.de,
              ate: searchParams.ate,
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quando</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Entidade</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Metadata</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-8 text-center text-muted-foreground"
                  >
                    Nenhum evento encontrado.
                  </TableCell>
                </TableRow>
              ) : null}
              {items.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap text-xs">
                    {log.createdAt.toLocaleString("pt-BR")}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        log.action.includes("FAIL") ||
                        log.action.includes("DELETE")
                          ? "destructive"
                          : log.action.startsWith("LOGIN") ||
                              log.action.includes("CREATE")
                            ? "success"
                            : "muted"
                      }
                    >
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {log.user ? (
                      <>
                        <p className="text-sm">{log.user.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {log.user.email}
                        </p>
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        (sem usuário)
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {log.entity ?? "—"}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {log.entityId ? log.entityId.slice(0, 8) + "..." : "—"}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {log.ip ?? "—"}
                  </TableCell>
                  <TableCell>
                    {log.metadata ? (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                          ver
                        </summary>
                        <pre className="mt-1 max-w-md overflow-x-auto rounded bg-muted p-2 text-xs">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      </details>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 ? (
        <div className="flex flex-wrap justify-center gap-1">
          {Array.from(
            { length: Math.min(totalPages, 10) },
            (_, i) => i + 1,
          ).map((p) => (
            <Button
              key={p}
              variant={p === page ? "default" : "outline"}
              size="sm"
              asChild
            >
              <Link href={pageHref(searchParams, p)}>{p}</Link>
            </Button>
          ))}
          {totalPages > 10 ? (
            <span className="self-center text-sm text-muted-foreground">
              ... +{totalPages - 10}
            </span>
          ) : null}
        </div>
      ) : null}
    </main>
  );
}

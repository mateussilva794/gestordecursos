import type { Role } from "@prisma/client";
import Link from "next/link";
import { getServerSession } from "next-auth";

import { UserRowActions } from "@/components/forms/user-row-actions";
import { UsersFilters } from "@/components/forms/users-filters";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { authOptions } from "@/lib/auth";
import { formatCpf } from "@/lib/cpf";
import {
  getDepartmentSuggestions,
  listUsers,
  type UsersRoleFilter,
  type UsersStatusFilter,
} from "@/lib/users";

export const metadata = { title: "Usuários — Administração" };

type SearchParams = {
  q?: string;
  role?: string;
  departamento?: string;
  status?: string;
  page?: string;
  created?: string;
};

function pageHref(searchParams: SearchParams, page: number): string {
  const params = new URLSearchParams();
  if (searchParams.q) params.set("q", searchParams.q);
  if (searchParams.role) params.set("role", searchParams.role);
  if (searchParams.departamento)
    params.set("departamento", searchParams.departamento);
  if (searchParams.status) params.set("status", searchParams.status);
  params.set("page", String(page));
  return `/admin/usuarios?${params.toString()}`;
}

function parseRole(role: string | undefined): UsersRoleFilter {
  if (role === "COLABORADOR" || role === "RH" || role === "ADMIN") return role;
  return "all";
}

function parseStatus(status: string | undefined): UsersStatusFilter {
  if (status === "active" || status === "inactive") return status;
  return "all";
}

const ROLE_LABEL: Record<Role, string> = {
  COLABORADOR: "Colaborador",
  RH: "RH",
  ADMIN: "Admin",
};

export default async function UsersListPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await getServerSession(authOptions);
  const selfId = session?.user?.id;

  const role = parseRole(searchParams.role);
  const status = parseStatus(searchParams.status);
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);

  const [{ items, total, totalPages }, departments] = await Promise.all([
    listUsers({
      search: searchParams.q,
      role,
      department: searchParams.departamento,
      status,
      page,
    }),
    getDepartmentSuggestions(),
  ]);

  return (
    <main className="container mx-auto space-y-6 p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/admin"
            className="text-sm text-muted-foreground hover:underline"
          >
            ← Painel
          </Link>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Usuários</h1>
          <p className="text-muted-foreground">
            {total} usuário{total === 1 ? "" : "s"} cadastrado
            {total === 1 ? "" : "s"}.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/usuarios/csv">Importar CSV</Link>
          </Button>
          <Button asChild>
            <Link href="/admin/usuarios/novo">Novo usuário</Link>
          </Button>
        </div>
      </div>

      {searchParams.created ? (
        <Alert>
          <AlertDescription>
            Usuário criado. Convite enviado (link de definição de senha no
            terminal do dev server).
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardContent className="pt-6">
          <UsersFilters
            departments={departments}
            defaultValues={{
              q: searchParams.q,
              role: role === "all" ? "all" : role,
              departamento: searchParams.departamento,
              status,
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Papel</TableHead>
                <TableHead>Departamento</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead className="text-right">Matrículas</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="py-8 text-center text-muted-foreground"
                  >
                    Nenhum usuário encontrado.
                  </TableCell>
                </TableRow>
              ) : null}
              {items.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <Link
                      href={`/admin/usuarios/${u.id}/editar`}
                      className="font-medium hover:underline"
                    >
                      {u.name}
                    </Link>
                    {u.id === selfId ? (
                      <Badge variant="outline" className="ml-2">
                        você
                      </Badge>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {u.email}
                  </TableCell>
                  <TableCell>{ROLE_LABEL[u.role]}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {u.department ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatCpf(u.cpf) || "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {u._count.enrollments}
                  </TableCell>
                  <TableCell>
                    {u.active ? (
                      <Badge variant="success">Ativo</Badge>
                    ) : (
                      <Badge variant="muted">Inativo</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <UserRowActions
                      userId={u.id}
                      isActive={u.active}
                      isSelf={u.id === selfId}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 ? (
        <div className="flex justify-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Button
              key={p}
              variant={p === page ? "default" : "outline"}
              size="sm"
              asChild
            >
              <Link href={pageHref(searchParams, p)}>{p}</Link>
            </Button>
          ))}
        </div>
      ) : null}
    </main>
  );
}

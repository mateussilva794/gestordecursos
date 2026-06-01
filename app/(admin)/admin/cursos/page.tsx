import Link from "next/link";

import { CourseRowActions } from "@/components/forms/course-row-actions";
import { CoursesFilters } from "@/components/forms/courses-filters";
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
import {
  type CourseStatusFilter,
  getCategorySuggestions,
  listCourses,
} from "@/lib/courses";

export const metadata = {
  title: "Cursos — Administração",
};

type SearchParams = {
  q?: string;
  categoria?: string;
  status?: CourseStatusFilter;
  page?: string;
};

function buildPageHref(
  base: string,
  searchParams: SearchParams,
  page: number,
): string {
  const params = new URLSearchParams();
  if (searchParams.q) params.set("q", searchParams.q);
  if (searchParams.categoria) params.set("categoria", searchParams.categoria);
  if (searchParams.status) params.set("status", searchParams.status);
  params.set("page", String(page));
  return `${base}?${params.toString()}`;
}

export default async function CoursesListPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const search = searchParams.q;
  const category = searchParams.categoria;
  const statusParam: CourseStatusFilter =
    searchParams.status === "active" || searchParams.status === "inactive"
      ? searchParams.status
      : "all";
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);

  const [{ items, total, totalPages }, categories] = await Promise.all([
    listCourses({ search, category, status: statusParam, page }),
    getCategorySuggestions(),
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
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Cursos</h1>
          <p className="text-muted-foreground">
            {total} curso{total === 1 ? "" : "s"} cadastrado
            {total === 1 ? "" : "s"}.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/cursos/novo">Novo curso</Link>
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <CoursesFilters
            categories={categories}
            defaultValues={{
              q: search,
              categoria: category,
              status: statusParam,
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Carga</TableHead>
                <TableHead className="text-right">Perguntas</TableHead>
                <TableHead className="text-right">Matrículas</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-8 text-center text-muted-foreground"
                  >
                    Nenhum curso encontrado.
                  </TableCell>
                </TableRow>
              ) : null}
              {items.map((course) => (
                <TableRow key={course.id}>
                  <TableCell>
                    <Link
                      href={`/admin/cursos/${course.id}/editar`}
                      className="font-medium hover:underline"
                    >
                      {course.title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {course.category ?? "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {course.workloadHours}h
                  </TableCell>
                  <TableCell className="text-right">
                    {course._count.questions}
                  </TableCell>
                  <TableCell className="text-right">
                    {course._count.enrollments}
                  </TableCell>
                  <TableCell>
                    {course.active ? (
                      <Badge variant="success">Ativo</Badge>
                    ) : (
                      <Badge variant="muted">Inativo</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <CourseRowActions
                      courseId={course.id}
                      isActive={course.active}
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
              <Link href={buildPageHref("/admin/cursos", searchParams, p)}>
                {p}
              </Link>
            </Button>
          ))}
        </div>
      ) : null}
    </main>
  );
}

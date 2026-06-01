"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  categories: string[];
  defaultValues: {
    q?: string;
    categoria?: string;
    status?: string;
  };
};

export function CoursesFilters({ categories, defaultValues }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  function navigate(updates: Record<string, string | undefined>) {
    const params = new URLSearchParams(sp.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value && value !== "all" && value !== "") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }
    params.delete("page");
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    navigate({
      q: formData.get("q")?.toString(),
      categoria: formData.get("categoria")?.toString(),
      status: formData.get("status")?.toString(),
    });
  }

  function clearFilters() {
    navigate({ q: undefined, categoria: undefined, status: "all" });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 gap-4 md:grid-cols-3"
    >
      <div className="space-y-2">
        <Label htmlFor="q">Buscar por título</Label>
        <Input
          id="q"
          name="q"
          defaultValue={defaultValues.q ?? ""}
          placeholder="Digite parte do título..."
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="categoria">Categoria</Label>
        <Input
          id="categoria"
          name="categoria"
          defaultValue={defaultValues.categoria ?? ""}
          list="filters-categories"
          placeholder="(todas)"
        />
        <datalist id="filters-categories">
          {categories.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </div>
      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          name="status"
          defaultValue={defaultValues.status ?? "all"}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="all">Todos</option>
          <option value="active">Ativos</option>
          <option value="inactive">Inativos</option>
        </select>
      </div>
      <div className="flex gap-2 md:col-span-3">
        <Button type="submit">Aplicar filtros</Button>
        <Button type="button" variant="outline" onClick={clearFilters}>
          Limpar
        </Button>
      </div>
    </form>
  );
}

"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  departments: string[];
  defaultValues: {
    q?: string;
    role?: string;
    departamento?: string;
    status?: string;
  };
};

export function UsersFilters({ departments, defaultValues }: Props) {
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

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    navigate({
      q: fd.get("q")?.toString(),
      role: fd.get("role")?.toString(),
      departamento: fd.get("departamento")?.toString(),
      status: fd.get("status")?.toString(),
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 gap-4 md:grid-cols-4"
    >
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="q">Buscar por nome ou email</Label>
        <Input
          id="q"
          name="q"
          defaultValue={defaultValues.q ?? ""}
          placeholder="Ex.: Ana, contábil, @dacto..."
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="role">Papel</Label>
        <select
          id="role"
          name="role"
          defaultValue={defaultValues.role ?? "all"}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="all">Todos</option>
          <option value="COLABORADOR">Colaborador</option>
          <option value="RH">RH</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          name="status"
          defaultValue={defaultValues.status ?? "all"}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="all">Todos</option>
          <option value="active">Ativos</option>
          <option value="inactive">Inativos</option>
        </select>
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="departamento">Departamento</Label>
        <Input
          id="departamento"
          name="departamento"
          defaultValue={defaultValues.departamento ?? ""}
          list="dept-suggestions"
          placeholder="(todos)"
        />
        <datalist id="dept-suggestions">
          {departments.map((d) => (
            <option key={d} value={d} />
          ))}
        </datalist>
      </div>
      <div className="flex gap-2 md:col-span-4">
        <Button type="submit">Aplicar filtros</Button>
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            navigate({
              q: undefined,
              role: "all",
              departamento: undefined,
              status: "all",
            })
          }
        >
          Limpar
        </Button>
      </div>
    </form>
  );
}

"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  actions: string[];
  defaultValues: {
    acao?: string;
    email?: string;
    entidade?: string;
    de?: string;
    ate?: string;
  };
};

export function AuditFilters({ actions, defaultValues }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  function navigate(updates: Record<string, string | undefined>) {
    const params = new URLSearchParams(sp.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value && value !== "") {
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
      acao: fd.get("acao")?.toString(),
      email: fd.get("email")?.toString(),
      entidade: fd.get("entidade")?.toString(),
      de: fd.get("de")?.toString(),
      ate: fd.get("ate")?.toString(),
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5"
    >
      <div className="space-y-2">
        <Label htmlFor="acao">Ação</Label>
        <Input
          id="acao"
          name="acao"
          defaultValue={defaultValues.acao ?? ""}
          list="audit-actions"
          placeholder="LOGIN, USER_CREATE..."
        />
        <datalist id="audit-actions">
          {actions.map((a) => (
            <option key={a} value={a} />
          ))}
        </datalist>
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email do usuário</Label>
        <Input
          id="email"
          name="email"
          defaultValue={defaultValues.email ?? ""}
          placeholder="parte do email..."
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="entidade">Entidade</Label>
        <Input
          id="entidade"
          name="entidade"
          defaultValue={defaultValues.entidade ?? ""}
          placeholder="User, Course..."
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="de">De</Label>
        <Input
          id="de"
          name="de"
          type="date"
          defaultValue={defaultValues.de ?? ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="ate">Até</Label>
        <Input
          id="ate"
          name="ate"
          type="date"
          defaultValue={defaultValues.ate ?? ""}
        />
      </div>
      <div className="flex gap-2 lg:col-span-5">
        <Button type="submit">Filtrar</Button>
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            navigate({
              acao: undefined,
              email: undefined,
              entidade: undefined,
              de: undefined,
              ate: undefined,
            })
          }
        >
          Limpar
        </Button>
      </div>
    </form>
  );
}

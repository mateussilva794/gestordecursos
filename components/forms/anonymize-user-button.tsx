"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { anonymizeUser } from "@/app/(admin)/admin/usuarios/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function AnonymizeUserButton({
  userId,
  userName,
}: {
  userId: string;
  userName: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onClick() {
    const confirm = window.prompt(
      `Anonimizar "${userName}"?\n\n` +
        `Isto remove nome, email, CPF e foto, ` +
        `mantém o histórico (matrículas, tentativas, certificados) com snapshots, ` +
        `desativa a conta e impede login.\n\n` +
        `Operação IRREVERSÍVEL. Digite ANONIMIZAR para confirmar:`,
    );
    if (confirm !== "ANONIMIZAR") return;

    setError(null);
    startTransition(async () => {
      const r = await anonymizeUser(userId);
      if (!r.ok) {
        setError(r.message);
        return;
      }
      router.push("/admin/usuarios");
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <Button variant="destructive" onClick={onClick} disabled={pending}>
        {pending ? "Anonimizando..." : "Anonimizar usuário"}
      </Button>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}

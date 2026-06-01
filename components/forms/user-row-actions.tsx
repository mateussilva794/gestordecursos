"use client";

import Link from "next/link";
import { useTransition } from "react";

import {
  resendInvitation,
  toggleUserActive,
} from "@/app/(admin)/admin/usuarios/actions";
import { Button } from "@/components/ui/button";

export function UserRowActions({
  userId,
  isActive,
  isSelf,
}: {
  userId: string;
  isActive: boolean;
  isSelf: boolean;
}) {
  const [pendingToggle, startToggle] = useTransition();
  const [pendingResend, startResend] = useTransition();

  function onToggle() {
    if (isSelf) return;
    startToggle(async () => {
      const result = await toggleUserActive(userId);
      if (!result.ok) window.alert(result.message);
    });
  }

  function onResend() {
    startResend(async () => {
      const result = await resendInvitation(userId);
      if (!result.ok) {
        window.alert(result.message);
        return;
      }
      window.alert(
        "Convite reenviado. Verifique o terminal do dev server para o link (stub de email).",
      );
    });
  }

  return (
    <div className="flex justify-end gap-1">
      <Button asChild variant="ghost" size="sm">
        <Link href={`/admin/usuarios/${userId}/editar`}>Editar</Link>
      </Button>
      <Button asChild variant="ghost" size="sm">
        <Link href={`/admin/usuarios/${userId}/matriculas`}>Matrículas</Link>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onResend}
        disabled={pendingResend || !isActive}
        title={!isActive ? "Reative o usuário antes de reenviar" : undefined}
      >
        {pendingResend ? "..." : "Reenviar convite"}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
        disabled={pendingToggle || isSelf}
        title={isSelf ? "Você não pode desativar a si mesmo" : undefined}
      >
        {pendingToggle ? "..." : isActive ? "Desativar" : "Ativar"}
      </Button>
    </div>
  );
}

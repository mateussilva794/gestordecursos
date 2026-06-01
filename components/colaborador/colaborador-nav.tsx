import Link from "next/link";
import { getServerSession } from "next-auth";

import { LogoutButton } from "@/components/forms/logout-button";
import { authOptions } from "@/lib/auth";
import { hasRole } from "@/lib/roles";

export async function ColaboradorNav() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  const showAdminLink = hasRole(session.user.role, "RH");

  return (
    <header className="border-b border-primary/10 bg-background shadow-sm">
      <div className="container mx-auto flex flex-wrap items-center justify-between gap-4 p-4">
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-semibold text-primary"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-placeholder.svg"
              alt="Dacto"
              className="h-8 w-auto"
            />
            <span className="hidden sm:inline">Treinamentos</span>
          </Link>
          <Link
            href="/dashboard"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Painel
          </Link>
          <Link
            href="/meus-certificados"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Meus certificados
          </Link>
          <Link
            href="/perfil"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Perfil
          </Link>
          {showAdminLink ? (
            <Link
              href="/admin"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Administração
            </Link>
          ) : null}
        </nav>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-muted-foreground sm:inline">
            {session.user.name}
          </span>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}

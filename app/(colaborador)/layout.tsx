import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { ColaboradorNav } from "@/components/colaborador/colaborador-nav";
import { authOptions } from "@/lib/auth";

// Layout-guard + shell visual com nav superior. Aplicado a todas as
// rotas do grupo (colaborador): /dashboard, /cursos/[id], /perfil,
// /meus-certificados.
export default async function ColaboradorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }
  return (
    <div className="min-h-screen bg-muted/20">
      <ColaboradorNav />
      {children}
    </div>
  );
}

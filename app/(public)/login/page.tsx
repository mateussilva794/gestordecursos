import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { LoginForm } from "@/components/forms/login-form";
import { authOptions } from "@/lib/auth";
import { getDefaultRedirectByRole } from "@/lib/roles";

export const metadata = {
  title: "Entrar — Gestor de Cursos e Certificados",
};

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session?.user) {
    redirect(getDefaultRedirectByRole(session.user.role));
  }
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}

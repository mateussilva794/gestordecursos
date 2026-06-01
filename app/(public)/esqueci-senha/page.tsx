import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { ForgotPasswordForm } from "@/components/forms/forgot-password-form";
import { authOptions } from "@/lib/auth";
import { getDefaultRedirectByRole } from "@/lib/roles";

export const metadata = {
  title: "Esqueci minha senha",
};

export default async function ForgotPasswordPage() {
  const session = await getServerSession(authOptions);
  if (session?.user) {
    redirect(getDefaultRedirectByRole(session.user.role));
  }
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <ForgotPasswordForm />
    </main>
  );
}

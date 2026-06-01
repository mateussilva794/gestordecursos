import crypto from "node:crypto";
import Link from "next/link";

import { ResetPasswordForm } from "@/components/forms/reset-password-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { db } from "@/lib/db";

export const metadata = {
  title: "Redefinir senha",
};

export default async function ResetPasswordPage({
  params,
}: {
  params: { token: string };
}) {
  const tokenHash = crypto
    .createHash("sha256")
    .update(params.token)
    .digest("hex");

  const record = await db.passwordResetToken.findUnique({
    where: { tokenHash },
  });

  const valid = !!record && !record.usedAt && record.expiresAt > new Date();

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      {valid ? (
        <ResetPasswordForm token={params.token} />
      ) : (
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Link inválido ou expirado</CardTitle>
            <CardDescription>
              Este link de recuperação não está mais válido.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>
                Por segurança, links de recuperação expiram em 1 hora e
                funcionam apenas uma vez. Solicite um novo se ainda precisar.
              </AlertDescription>
            </Alert>
            <p className="text-center text-sm">
              <Link
                href="/esqueci-senha"
                className="text-primary underline-offset-4 hover:underline"
              >
                Solicitar novo link
              </Link>
            </p>
          </CardContent>
        </Card>
      )}
    </main>
  );
}

"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { requestPasswordReset } from "@/app/(public)/esqueci-senha/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ForgotPasswordForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await requestPasswordReset(formData);
      setMessage(result.message);
    });
  }

  if (message) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Recuperação de senha</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
          <p className="text-center text-sm">
            <Link
              href="/login"
              className="text-primary underline-offset-4 hover:underline"
            >
              Voltar ao login
            </Link>
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Recuperação de senha</CardTitle>
        <CardDescription>
          Informe seu email e enviaremos um link para criar uma nova senha.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={onSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              autoFocus
            />
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Enviando..." : "Enviar link"}
          </Button>
          <p className="text-center text-sm">
            <Link
              href="/login"
              className="text-primary underline-offset-4 hover:underline"
            >
              Voltar ao login
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

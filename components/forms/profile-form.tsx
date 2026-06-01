"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { updateProfile } from "@/app/(colaborador)/perfil/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { profileSchema, type ProfileInput } from "@/lib/validators/profile";

type ProfileFormProps = {
  defaultName: string;
  email: string;
  role: string;
  department: string | null;
};

export function ProfileForm({
  defaultName,
  email,
  role,
  department,
}: ProfileFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: defaultName },
  });

  async function onSubmit(data: ProfileInput) {
    setSubmitting(true);
    setServerError(null);
    setSuccess(false);
    const r = await updateProfile(data);
    setSubmitting(false);
    if (!r.ok) {
      setServerError(r.message);
      return;
    }
    setSuccess(true);
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4"
      noValidate
    >
      {success ? (
        <Alert>
          <AlertDescription>Dados atualizados.</AlertDescription>
        </Alert>
      ) : null}
      {serverError ? (
        <Alert variant="destructive">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" {...register("name")} />
        {errors.name ? (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" value={email} disabled className="opacity-70" />
        <p className="text-xs text-muted-foreground">
          Email é gerenciado pelo administrador.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="role">Papel</Label>
          <Input id="role" value={role} disabled className="opacity-70" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="department">Departamento</Label>
          <Input
            id="department"
            value={department ?? ""}
            disabled
            className="opacity-70"
          />
        </div>
      </div>

      <Button type="submit" disabled={submitting}>
        {submitting ? "Salvando..." : "Salvar nome"}
      </Button>
    </form>
  );
}

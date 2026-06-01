"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  useForm,
  type FieldErrors,
  type UseFormRegister,
} from "react-hook-form";

import { createUser, updateUser } from "@/app/(admin)/admin/usuarios/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  userCreateSchema,
  userUpdateSchema,
  type UserCreateInput,
  type UserUpdateInput,
} from "@/lib/validators/user";

type UserFormProps =
  | {
      mode: "create";
      departmentSuggestions: string[];
    }
  | {
      mode: "edit";
      userId: string;
      initialData: UserUpdateInput;
      isSelf: boolean;
      departmentSuggestions: string[];
    };

const EMPTY_CREATE: UserCreateInput = {
  name: "",
  email: "",
  role: "COLABORADOR",
  department: "",
  position: "",
  cpf: "",
};

export function UserForm(props: UserFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (props.mode === "create") {
    return (
      <CreateForm
        departmentSuggestions={props.departmentSuggestions}
        onCancel={() => router.back()}
        onDone={() => {
          router.push("/admin/usuarios?created=1");
          router.refresh();
        }}
        submitting={submitting}
        setSubmitting={setSubmitting}
        serverError={serverError}
        setServerError={setServerError}
      />
    );
  }

  return (
    <EditForm
      userId={props.userId}
      initialData={props.initialData}
      isSelf={props.isSelf}
      departmentSuggestions={props.departmentSuggestions}
      onCancel={() => router.back()}
      onDone={() => {
        router.push("/admin/usuarios");
        router.refresh();
      }}
      submitting={submitting}
      setSubmitting={setSubmitting}
      serverError={serverError}
      setServerError={setServerError}
    />
  );
}

type SharedProps = {
  onCancel: () => void;
  onDone: () => void;
  submitting: boolean;
  setSubmitting: (v: boolean) => void;
  serverError: string | null;
  setServerError: (v: string | null) => void;
  departmentSuggestions: string[];
};

function CreateForm({
  departmentSuggestions,
  onCancel,
  onDone,
  submitting,
  setSubmitting,
  serverError,
  setServerError,
}: SharedProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UserCreateInput>({
    resolver: zodResolver(userCreateSchema),
    defaultValues: EMPTY_CREATE,
  });

  async function onSubmit(data: UserCreateInput) {
    setSubmitting(true);
    setServerError(null);
    const result = await createUser(data);
    setSubmitting(false);
    if (!result.ok) {
      setServerError(result.message);
      return;
    }
    onDone();
  }

  return (
    <FormShell
      onSubmit={handleSubmit(onSubmit)}
      onCancel={onCancel}
      submitting={submitting}
      submitLabel="Criar usuário e enviar convite"
      serverError={serverError}
    >
      <CommonFields
        register={register as unknown as UseFormRegister<AnyFields>}
        errors={errors as unknown as FieldErrors<AnyFields>}
        departmentSuggestions={departmentSuggestions}
        roleSelectableForSelf
      />
      <p className="text-sm text-muted-foreground">
        Um email de convite será gerado com link para definição inicial de
        senha (válido por 7 dias). O link aparece no terminal do dev server
        (stub).
      </p>
    </FormShell>
  );
}

function EditForm({
  userId,
  initialData,
  isSelf,
  departmentSuggestions,
  onCancel,
  onDone,
  submitting,
  setSubmitting,
  serverError,
  setServerError,
}: SharedProps & {
  userId: string;
  initialData: UserUpdateInput;
  isSelf: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UserUpdateInput>({
    resolver: zodResolver(userUpdateSchema),
    defaultValues: initialData,
  });

  async function onSubmit(data: UserUpdateInput) {
    setSubmitting(true);
    setServerError(null);
    const result = await updateUser(userId, data);
    setSubmitting(false);
    if (!result.ok) {
      setServerError(result.message);
      return;
    }
    onDone();
  }

  return (
    <FormShell
      onSubmit={handleSubmit(onSubmit)}
      onCancel={onCancel}
      submitting={submitting}
      submitLabel="Salvar alterações"
      serverError={serverError}
    >
      <CommonFields
        register={register as unknown as UseFormRegister<AnyFields>}
        errors={errors as unknown as FieldErrors<AnyFields>}
        departmentSuggestions={departmentSuggestions}
        roleSelectableForSelf={!isSelf}
      />
      <div className="flex items-center gap-2">
        <input
          id="active"
          type="checkbox"
          disabled={isSelf}
          className="h-4 w-4 cursor-pointer accent-primary"
          {...register("active")}
        />
        <Label htmlFor="active" className="cursor-pointer">
          Usuário ativo
        </Label>
        {isSelf ? (
          <span className="text-xs text-muted-foreground">
            (você não pode desativar a si mesmo)
          </span>
        ) : null}
      </div>
    </FormShell>
  );
}

// Tipos largos: o componente é compartilhado entre create e edit.
// A validação de campos é responsabilidade do schema zod (server e form).
type AnyFields = Record<string, unknown>;

function CommonFields({
  register,
  errors,
  departmentSuggestions,
  roleSelectableForSelf,
}: {
  register: UseFormRegister<AnyFields>;
  errors: FieldErrors<AnyFields>;
  departmentSuggestions: string[];
  roleSelectableForSelf: boolean;
}) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="name">Nome completo</Label>
        <Input id="name" {...register("name")} />
        {errors.name ? (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="off"
            {...register("email")}
          />
          {errors.email ? (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">Papel</Label>
          <select
            id="role"
            disabled={!roleSelectableForSelf}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            {...register("role")}
          >
            <option value="COLABORADOR">Colaborador</option>
            <option value="RH">RH</option>
            <option value="ADMIN">Admin</option>
          </select>
          {!roleSelectableForSelf ? (
            <p className="text-xs text-muted-foreground">
              Você não pode alterar seu próprio papel.
            </p>
          ) : null}
          {errors.role ? (
            <p className="text-sm text-destructive">{errors.role.message}</p>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="department">Departamento</Label>
          <Input
            id="department"
            list="user-dept-suggestions"
            placeholder="Ex.: Contábil, Fiscal, Folha..."
            {...register("department")}
          />
          <datalist id="user-dept-suggestions">
            {departmentSuggestions.map((d) => (
              <option key={d} value={d} />
            ))}
          </datalist>
        </div>
        <div className="space-y-2">
          <Label htmlFor="position">Cargo</Label>
          <Input
            id="position"
            placeholder="Ex.: Analista Fiscal"
            {...register("position")}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="cpf">CPF (opcional)</Label>
        <Input
          id="cpf"
          placeholder="000.000.000-00"
          {...register("cpf")}
        />
        {errors.cpf ? (
          <p className="text-sm text-destructive">{errors.cpf.message}</p>
        ) : null}
      </div>
    </>
  );
}

function FormShell({
  onSubmit,
  onCancel,
  submitting,
  submitLabel,
  serverError,
  children,
}: {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  submitting: boolean;
  submitLabel: string;
  serverError: string | null;
  children: React.ReactNode;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      {serverError ? (
        <Alert variant="destructive">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      ) : null}
      {children}
      <div className="flex gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Salvando..." : submitLabel}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

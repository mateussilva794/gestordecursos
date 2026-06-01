import { z } from "zod";

import { isValidCpf } from "@/lib/cpf";

const ROLE_ENUM = z.enum(["COLABORADOR", "RH", "ADMIN"]);

const cpfField = z
  .string()
  .trim()
  .max(20)
  .optional()
  .nullable()
  .refine((value) => {
    if (!value || value.trim() === "") return true;
    return isValidCpf(value);
  }, "CPF inválido (verifique os dígitos).");

const nameField = z
  .string()
  .trim()
  .min(2, "Nome mínimo 2 caracteres.")
  .max(200);

const emailField = z
  .string()
  .trim()
  .email("Email inválido.")
  .max(200);

const departmentField = z
  .string()
  .trim()
  .max(80)
  .optional()
  .nullable();

const positionField = z
  .string()
  .trim()
  .max(80)
  .optional()
  .nullable();

export const userCreateSchema = z.object({
  name: nameField,
  email: emailField,
  role: ROLE_ENUM,
  department: departmentField,
  position: positionField,
  cpf: cpfField,
});

export type UserCreateInput = z.infer<typeof userCreateSchema>;

export const userUpdateSchema = userCreateSchema.extend({
  active: z.coerce.boolean(),
});

export type UserUpdateInput = z.infer<typeof userUpdateSchema>;

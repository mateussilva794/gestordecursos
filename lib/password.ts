import bcrypt from "bcryptjs";
import { z } from "zod";

const BCRYPT_COST = 10;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_COST);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// Política mínima: 8 caracteres + pelo menos 1 número.
export const passwordPolicySchema = z
  .string()
  .min(8, "A senha deve ter pelo menos 8 caracteres.")
  .refine((value) => /\d/.test(value), "A senha deve conter pelo menos um número.");

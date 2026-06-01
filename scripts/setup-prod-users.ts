/**
 * Script de setup de usuários de produção.
 * Lê credenciais de variáveis de ambiente — nunca hardcode senhas aqui.
 *
 * Uso:
 *   ADMIN_EMAIL=x ADMIN_PASSWORD=x RH_EMAIL=x RH_PASSWORD=x npx tsx scripts/setup-prod-users.ts
 *
 * Ou com as variáveis já no .env do servidor, basta rodar:
 *   npx tsx scripts/setup-prod-users.ts
 */

import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const BCRYPT_COST = 12;

async function main() {
  const adminEmail = process.env.PROD_ADMIN_EMAIL;
  const adminPassword = process.env.PROD_ADMIN_PASSWORD;
  const rhEmail = process.env.PROD_RH_EMAIL;
  const rhPassword = process.env.PROD_RH_PASSWORD;

  if (!adminEmail || !adminPassword || !rhEmail || !rhPassword) {
    console.error("Variáveis obrigatórias não definidas:");
    console.error("  PROD_ADMIN_EMAIL, PROD_ADMIN_PASSWORD, PROD_RH_EMAIL, PROD_RH_PASSWORD");
    process.exit(1);
  }

  console.log("[setup] Criando/atualizando usuários de produção...");

  const adminHash = await bcrypt.hash(adminPassword, BCRYPT_COST);
  const rhHash = await bcrypt.hash(rhPassword, BCRYPT_COST);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash: adminHash, role: Role.ADMIN, active: true },
    create: {
      name: "Administrador",
      email: adminEmail,
      passwordHash: adminHash,
      role: Role.ADMIN,
      department: "Diretoria",
      position: "Administrador",
    },
  });

  const rh = await prisma.user.upsert({
    where: { email: rhEmail },
    update: { passwordHash: rhHash, role: Role.RH, active: true },
    create: {
      name: "Recursos Humanos",
      email: rhEmail,
      passwordHash: rhHash,
      role: Role.RH,
      department: "RH",
      position: "Analista de RH",
    },
  });

  console.log(`[setup] ADMIN criado/atualizado: ${admin.email}`);
  console.log(`[setup] RH criado/atualizado:    ${rh.email}`);
  console.log("[setup] Concluído.");
}

main()
  .catch((e) => {
    console.error("[setup] Falha:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

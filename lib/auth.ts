import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { writeAuditLog } from "@/lib/audit";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/password";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutos
const SESSION_MAX_AGE_S = 24 * 60 * 60; // 24 horas

function extractIp(headers: Record<string, unknown> | undefined): string | null {
  if (!headers) return null;
  const fwd = headers["x-forwarded-for"];
  if (typeof fwd === "string") return fwd.split(",")[0]?.trim() ?? null;
  const real = headers["x-real-ip"];
  if (typeof real === "string") return real;
  return null;
}

function extractUserAgent(headers: Record<string, unknown> | undefined): string | null {
  if (!headers) return null;
  const ua = headers["user-agent"];
  return typeof ua === "string" ? ua : null;
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: SESSION_MAX_AGE_S },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials.password) return null;

        const headers = req?.headers as Record<string, unknown> | undefined;
        const ip = extractIp(headers);
        const userAgent = extractUserAgent(headers);

        const email = credentials.email.toLowerCase().trim();
        const user = await db.user.findUnique({ where: { email } });

        // Usuário inexistente ou inativo — resposta genérica, sem distinguir do erro de senha.
        if (!user || !user.active) {
          await writeAuditLog({
            action: "LOGIN_FAIL",
            entity: "User",
            metadata: { email, reason: !user ? "unknown_email" : "inactive" },
            ip,
            userAgent,
          });
          return null;
        }

        // Lockout ativo
        if (user.lockedUntil && user.lockedUntil > new Date()) {
          await writeAuditLog({
            userId: user.id,
            action: "LOGIN_FAIL",
            entity: "User",
            entityId: user.id,
            metadata: { reason: "locked", lockedUntil: user.lockedUntil.toISOString() },
            ip,
            userAgent,
          });
          // Mensagem repassada ao cliente como result.error
          throw new Error(`LOCKED:${user.lockedUntil.toISOString()}`);
        }

        const valid = await verifyPassword(credentials.password, user.passwordHash);

        if (!valid) {
          const failedAttempts = user.failedLoginAttempts + 1;
          const shouldLock = failedAttempts >= MAX_FAILED_ATTEMPTS;
          await db.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: failedAttempts,
              lockedUntil: shouldLock ? new Date(Date.now() + LOCKOUT_DURATION_MS) : null,
            },
          });
          await writeAuditLog({
            userId: user.id,
            action: "LOGIN_FAIL",
            entity: "User",
            entityId: user.id,
            metadata: { reason: "bad_password", failedAttempts, locked: shouldLock },
            ip,
            userAgent,
          });
          if (shouldLock) {
            throw new Error(
              `LOCKED:${new Date(Date.now() + LOCKOUT_DURATION_MS).toISOString()}`,
            );
          }
          return null;
        }

        // Sucesso: reseta contadores
        await db.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: 0,
            lockedUntil: null,
            lastLoginAt: new Date(),
          },
        });

        await writeAuditLog({
          userId: user.id,
          action: "LOGIN",
          entity: "User",
          entityId: user.id,
          ip,
          userAgent,
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as { id: string }).id;
        token.role = (user as { role: "COLABORADOR" | "RH" | "ADMIN" }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (!token?.id || !session.user) return session;

      session.user.id = token.id;
      session.user.role = token.role;

      // Verifica se o usuário continua ativo e se a senha não foi trocada
      // depois da emissão do token (invalida sessões antigas).
      const user = await db.user.findUnique({
        where: { id: token.id },
        select: { active: true, passwordChangedAt: true },
      });

      if (!user || !user.active) {
        // Retornando sessão sem user dispara reauth no client.
        return { ...session, user: undefined } as unknown as typeof session;
      }

      if (
        user.passwordChangedAt &&
        typeof token.iat === "number" &&
        user.passwordChangedAt.getTime() > token.iat * 1000
      ) {
        return { ...session, user: undefined } as unknown as typeof session;
      }

      return session;
    },
  },
  events: {
    async signOut({ token }) {
      if (token?.id) {
        await writeAuditLog({
          userId: token.id as string,
          action: "LOGOUT",
        });
      }
    },
  },
};

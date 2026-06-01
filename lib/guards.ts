import type { Role } from "@prisma/client";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { hasRole } from "@/lib/roles";

export class AuthorizationError extends Error {
  constructor(message = "Sem permissão.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new AuthorizationError("Não autenticado.");
  }
  return session.user;
}

export async function requireRole(minRole: Role) {
  const user = await requireSession();
  if (!hasRole(user.role, minRole)) {
    throw new AuthorizationError();
  }
  return user;
}

// Pra route handlers REST: tenta autorizar, devolve null se OK ou uma
// Response com status 401/403 se faltar autenticação/permissão. Evita 500.
export async function guardApiRoute(minRole: Role): Promise<Response | null> {
  try {
    await requireRole(minRole);
    return null;
  } catch (error) {
    if (error instanceof AuthorizationError) {
      const status = error.message === "Não autenticado." ? 401 : 403;
      return new Response(error.message, { status });
    }
    throw error;
  }
}

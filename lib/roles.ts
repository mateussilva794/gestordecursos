import type { Role } from "@prisma/client";

// Hierarquia: ADMIN ⊇ RH ⊇ COLABORADOR
const ROLE_RANK: Record<Role, number> = {
  COLABORADOR: 1,
  RH: 2,
  ADMIN: 3,
};

export function hasRole(userRole: Role | null | undefined, minRole: Role): boolean {
  if (!userRole) return false;
  return ROLE_RANK[userRole] >= ROLE_RANK[minRole];
}

export function getDefaultRedirectByRole(role: Role): string {
  return role === "COLABORADOR" ? "/dashboard" : "/admin";
}

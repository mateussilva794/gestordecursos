import type { DefaultSession } from "next-auth";

type Role = "COLABORADOR" | "RH" | "ADMIN";

// Ampliação dos tipos do NextAuth para carregar o papel (role) do usuário
// no Session e no JWT. Usado pelos guards de rota e pelas API routes.
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
  }
}

import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Middleware de proteção de rotas no edge.
// - Bloqueia rotas privadas sem sessão (redireciona para /login).
// - Bloqueia /admin para COLABORADOR.
// - Bloqueia sub-rotas ADMIN-only para usuários sem o papel ADMIN.
//
// A checagem de invalidação (active/passwordChangedAt) acontece no
// callback session do NextAuth (lib/auth.ts) — não dá pra hitear o
// Prisma no edge sem Data Proxy.
export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const role = req.nextauth.token?.role as
      | "COLABORADOR"
      | "RH"
      | "ADMIN"
      | undefined;

    // Sub-rotas exclusivas de ADMIN
    const adminOnlyPrefixes = [
      "/admin/usuarios",
      "/admin/auditoria",
      "/admin/configuracoes",
    ];
    if (
      adminOnlyPrefixes.some(
        (p) => pathname === p || pathname.startsWith(p + "/"),
      ) &&
      role !== "ADMIN"
    ) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }

    // Demais rotas /admin/* exigem RH ou ADMIN
    if (pathname.startsWith("/admin") && role === "COLABORADOR") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  },
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/cursos/:path*",
    "/meus-certificados/:path*",
    "/perfil/:path*",
    "/admin/:path*",
  ],
};

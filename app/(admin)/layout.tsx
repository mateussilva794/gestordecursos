import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { hasRole } from "@/lib/roles";

// Layout-guard para /admin/*: exige sessão e papel >= RH.
// Defesa em profundidade junto com o middleware.
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }
  if (!hasRole(session.user.role, "RH")) {
    redirect("/dashboard");
  }
  return <>{children}</>;
}

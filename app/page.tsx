import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { getDefaultRedirectByRole } from "@/lib/roles";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (session?.user) {
    redirect(getDefaultRedirectByRole(session.user.role));
  }
  redirect("/login");
}

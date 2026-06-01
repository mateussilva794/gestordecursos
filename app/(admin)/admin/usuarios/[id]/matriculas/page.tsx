import Link from "next/link";
import { notFound } from "next/navigation";

import { UserEnrollmentsList } from "@/components/forms/user-enrollments-list";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getAvailableCoursesForUser,
  getUserById,
  getUserEnrollments,
} from "@/lib/users";

export const metadata = { title: "Matrículas do usuário" };

export default async function UserEnrollmentsPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getUserById(params.id);
  if (!user) notFound();

  const [enrollments, availableCourses] = await Promise.all([
    getUserEnrollments(user.id),
    getAvailableCoursesForUser(user.id),
  ]);

  const rows = enrollments.map((e) => ({
    courseId: e.courseId,
    courseTitle: e.course.title,
    status: e.status,
    attemptsAllowed: e.attemptsAllowed,
    attemptsUsed: e._count.attempts,
    courseActive: e.course.active,
  }));

  return (
    <main className="container mx-auto max-w-4xl space-y-6 p-8">
      <div>
        <Link
          href="/admin/usuarios"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Usuários
        </Link>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Matrículas de {user.name}
        </h1>
        <p className="text-muted-foreground">
          {user.email} · {enrollments.length} matrícula(s).
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Matrículas atuais</CardTitle>
        </CardHeader>
        <CardContent>
          <UserEnrollmentsList
            userId={user.id}
            enrollments={rows}
            availableCourses={availableCourses}
          />
        </CardContent>
      </Card>
    </main>
  );
}

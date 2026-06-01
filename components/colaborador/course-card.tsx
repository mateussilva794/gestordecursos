import type { EnrollmentStatus } from "@prisma/client";
import Link from "next/link";

import { EnrollmentStatusBadge } from "@/components/colaborador/enrollment-status-badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type CourseCardProps = {
  courseId: string;
  title: string;
  category: string | null;
  workloadHours: number;
  status: EnrollmentStatus;
  courseActive: boolean;
};

export function CourseCard({
  courseId,
  title,
  category,
  workloadHours,
  status,
  courseActive,
}: CourseCardProps) {
  return (
    <Link href={`/cursos/${courseId}`} className="block">
      <Card className="h-full transition-colors hover:bg-accent">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="text-base font-semibold leading-snug">
              {title}
            </CardTitle>
            <EnrollmentStatusBadge status={status} />
          </div>
          <CardDescription>
            {category ? `${category} · ` : ""}
            {workloadHours}h
            {!courseActive ? " · curso desativado" : ""}
          </CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}

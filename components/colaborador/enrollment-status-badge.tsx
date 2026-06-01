import type { EnrollmentStatus } from "@prisma/client";

import { Badge } from "@/components/ui/badge";

export function EnrollmentStatusBadge({
  status,
}: {
  status: EnrollmentStatus;
}) {
  switch (status) {
    case "COMPLETED":
      return <Badge variant="success">Concluído</Badge>;
    case "IN_PROGRESS":
      return <Badge variant="secondary">Em andamento</Badge>;
    case "BLOCKED":
      return <Badge variant="destructive">Bloqueado</Badge>;
    case "NOT_STARTED":
    default:
      return <Badge variant="muted">Não iniciado</Badge>;
  }
}

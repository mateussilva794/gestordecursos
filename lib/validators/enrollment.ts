import { z } from "zod";

export const bulkEnrollSchema = z.object({
  courseIds: z
    .array(z.string().min(1))
    .min(1, "Selecione pelo menos um curso."),
  filterRole: z.enum(["COLABORADOR", "RH", "ADMIN", "ALL"]),
  filterDepartment: z.string().trim().max(80).optional().nullable(),
  onlyActive: z.coerce.boolean(),
});

export type BulkEnrollInput = z.infer<typeof bulkEnrollSchema>;

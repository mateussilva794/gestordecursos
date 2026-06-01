import { PrismaClient } from "@prisma/client";

// Singleton: evita criar múltiplas instâncias do PrismaClient durante o hot-reload do Next.js em dev.
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const db =
  global.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = db;
}

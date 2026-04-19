import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __luminaryPrisma: PrismaClient | undefined;
}

const prisma =
  globalThis.__luminaryPrisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    log: process.env.NODE_ENV === "development" ? (["warn", "error"] as const) : (["error"] as const),
  });

globalThis.__luminaryPrisma = prisma;

export { prisma };
export default prisma;

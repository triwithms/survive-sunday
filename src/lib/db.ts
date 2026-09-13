import { PrismaClient } from "@prisma/client";
import { prismaDatasourceUrl } from "./prisma-url";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const datasourceUrl = prismaDatasourceUrl();

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    ...(datasourceUrl ? { datasources: { db: { url: datasourceUrl } } } : {}),
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

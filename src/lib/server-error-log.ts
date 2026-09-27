import { prisma } from "./db";
import { ensureServerErrorTable } from "./server-error-schema";

const MAX_MESSAGE = 500;
const MAX_ROUTE = 180;

let ensured: Promise<void> | null = null;
let recording = false;

function ensureOnce(): Promise<void> {
  if (!ensured) {
    ensured = ensureServerErrorTable(prisma).catch((error) => {
      ensured = null;
      throw error;
    });
  }
  return ensured;
}

export type ServerErrorRow = {
  id: string;
  route: string;
  message: string;
  createdAt: string;
  source: string;
};

/** Never throws. Safe to call from an error boundary or a failing request. */
export async function recordServerError(input: {
  route: string;
  message: string;
  digest?: string | null;
  source?: string;
}): Promise<void> {
  if (recording) return;
  recording = true;
  try {
    await ensureOnce();
    const message = input.message.replace(/\s+/g, " ").trim().slice(0, MAX_MESSAGE);
    if (!message) return;
    await prisma.serverError.create({
      data: {
        route: (input.route || "unknown").slice(0, MAX_ROUTE),
        message,
        digest: input.digest ? input.digest.slice(0, 80) : null,
        source: (input.source || "request").slice(0, 40),
      },
    });
    await prisma.$executeRawUnsafe(
      `DELETE FROM "ServerError" WHERE "createdAt" < NOW() - INTERVAL '14 days'`
    );
  } catch (error) {
    console.error("[server-error] record failed", error);
  } finally {
    recording = false;
  }
}

export async function listRecentServerErrors(
  take = 15
): Promise<ServerErrorRow[]> {
  try {
    await ensureOnce();
    const rows = await prisma.serverError.findMany({
      orderBy: { createdAt: "desc" },
      take,
      select: {
        id: true,
        route: true,
        message: true,
        createdAt: true,
        source: true,
      },
    });
    return rows.map((row) => ({
      id: row.id,
      route: row.route,
      message: row.message,
      createdAt: row.createdAt.toISOString(),
      source: row.source,
    }));
  } catch (error) {
    console.error("[server-error] list failed", error);
    return [];
  }
}

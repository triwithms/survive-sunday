import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  clientErrorRoute,
  createRateGate,
  parseClientErrorBody,
} from "@/lib/client-error";
import { recordServerError } from "@/lib/server-error-log";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const MAX_BODY = 4000;
const allow = createRateGate(30, 60_000);

/**
 * Player-screen crash reports (error boundaries) for Admin → System →
 * Server errors. Signed-in only. Always 204 so a beacon never retries.
 */
export async function POST(req: Request) {
  const done = new NextResponse(null, { status: 204 });
  try {
    const session = await auth();
    if (!session?.user?.id) return done;
    const text = (await req.text()).slice(0, MAX_BODY);
    const report = parseClientErrorBody(JSON.parse(text));
    if (!report || !allow(Date.now())) return done;
    await recordServerError({
      route: clientErrorRoute(report),
      message: report.message,
      source: "client",
    });
  } catch (error) {
    console.error("[client-error] report skipped", error);
  }
  return done;
}

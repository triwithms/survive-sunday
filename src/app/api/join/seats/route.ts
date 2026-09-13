import { NextResponse } from "next/server";
import { listClaimableSeats } from "@/lib/claim-seat-db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Public list of player seats (nickname + real name). No emails. */
export async function GET() {
  try {
    const seats = await listClaimableSeats();
    return NextResponse.json({ seats });
  } catch (error) {
    console.error("[join/seats] list failed", error);
    return NextResponse.json({ seats: [], error: "Roster unavailable" }, { status: 503 });
  }
}

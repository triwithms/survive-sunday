import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Public roster list removed — cold entry is Sign in, not a people picker. */
export async function GET() {
  return NextResponse.json({ seats: [] });
}

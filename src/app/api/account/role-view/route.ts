import { NextResponse } from "next/server";
import { requireUser, getUserPoolContext } from "@/lib/session";
import { ROLE_VIEW_COOKIE, resolveRoleView, type RoleView } from "@/lib/roles";

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Sign in first" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { view?: unknown };
  const requested = body.view === "admin" || body.view === "player" ? body.view : "";
  if (!requested) {
    return NextResponse.json({ error: "Pick Player or Admin" }, { status: 400 });
  }

  const ctx = await getUserPoolContext(user.id);
  const view: RoleView = resolveRoleView({
    isPlayer: ctx.isPlayer,
    isAdmin: ctx.isAdmin,
    requested,
  });
  if (requested === "admin" && !ctx.isAdmin) {
    return NextResponse.json(
      { error: "You don’t have administrator access" },
      { status: 403 }
    );
  }

  const res = NextResponse.json({ ok: true, view });
  res.cookies.set(ROLE_VIEW_COOKIE, view, {
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}

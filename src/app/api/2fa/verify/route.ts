import { NextResponse } from "next/server";
import { AuthError } from "next-auth";
import { auth, signIn } from "@/lib/auth";
import { verifyTwoFactorCode } from "@/lib/two-factor-service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Check the one-time code, then finish the Auth.js session in this
 * route handler so `cookies().set()` lands on the JSON response —
 * same pattern as demo-enter JSON login.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!session.twoFactorPending) {
    return NextResponse.json({ ok: true, alreadyComplete: true });
  }

  let code: unknown;
  try {
    const body = (await req.json()) as { code?: unknown };
    code = body.code;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const checked = await verifyTwoFactorCode(
    { id: session.user.id, email: session.user.email },
    code
  );
  if (!checked.ok) {
    return NextResponse.json(
      { error: checked.error, locked: Boolean(checked.locked) },
      { status: 400 }
    );
  }

  try {
    const result = await signIn("two-factor", {
      grant: checked.grant,
      redirect: false,
      redirectTo: "/pool",
    });
    if (typeof result === "string" && /error=/.test(result)) {
      return NextResponse.json(
        { error: "Sign-in failed after the code. Try again." },
        { status: 401 }
      );
    }
    if (typeof result === "string" && /\/api\/auth\/callback\//.test(result)) {
      return NextResponse.json({ error: "NoSession" }, { status: 401 });
    }
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.type }, { status: 401 });
    }
    console.error("[2fa] complete sign-in failed", error);
    return NextResponse.json({ error: "Could not finish sign-in." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

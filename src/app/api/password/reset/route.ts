import { NextResponse } from "next/server";
import { resetPasswordWithCode } from "@/lib/password-reset";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: Request) {
  let email = "";
  let code: unknown;
  let password: unknown;
  try {
    const body = (await req.json()) as {
      email?: unknown;
      code?: unknown;
      password?: unknown;
    };
    email = typeof body.email === "string" ? body.email : "";
    code = body.code;
    password = body.password;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = await resetPasswordWithCode(email, code, password);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, locked: Boolean(result.locked) },
      { status: 400 }
    );
  }
  return NextResponse.json({ ok: true });
}

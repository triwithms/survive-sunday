import { NextResponse } from "next/server";
import { ensureDemoAccount } from "@/lib/demo-account";
import { signInDemoCredentials } from "@/lib/demo-session";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email =
    (body.email as string) || "gams@survivesunday.demo";
  const password = (body.password as string) || "demo1234";
  try {
    await ensureDemoAccount(email, password);
  } catch (error) {
    console.error("[demo-login] ensureDemoAccount failed", error);
    return NextResponse.json({ error: "DatabaseUnavailable" }, { status: 503 });
  }
  const result = await signInDemoCredentials(email, password, "/pool");
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error === "CredentialsSignin" ? "Invalid credentials" : result.error },
      { status: 401 }
    );
  }
  return NextResponse.json({ ok: true, email });
}

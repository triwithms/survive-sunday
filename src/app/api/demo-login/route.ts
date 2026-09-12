import { NextResponse } from "next/server";
import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email =
    (body.email as string) || "gams@survivesunday.demo";
  const password = (body.password as string) || "demo1234";
  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    return NextResponse.json({ ok: true, email });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }
    // NextAuth may throw NEXT_REDIRECT — treat as success when redirect:false still redirects
    return NextResponse.json({ ok: true, email });
  }
}

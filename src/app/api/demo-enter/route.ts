import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { ensureDemoAccount } from "@/lib/demo-account";
import { signInDemoCredentials } from "@/lib/demo-session";

/**
 * Form + JSON demo login. Auth.js writes the session via `cookies().set()`.
 * Success must `redirect()` (not `NextResponse.redirect`) so those cookies
 * stay on the response. A 303 built by hand was landing on /signed-in
 * with no session cookie → `?error=NoSession`.
 */
export async function POST(req: Request) {
  const wantsJson = (req.headers.get("accept") ?? "").includes("application/json");
  let email = "gams@survivesunday.demo";
  let password = "demo1234";
  try {
    const ct = req.headers.get("content-type") ?? "";
    if (ct.includes("application/json")) {
      const body = (await req.json().catch(() => ({}))) as {
        email?: string;
        password?: string;
      };
      if (body.email) email = String(body.email);
      if (body.password) password = String(body.password);
    } else {
      const form = await req.formData();
      const e = form.get("email");
      const p = form.get("password");
      if (typeof e === "string" && e) email = e;
      if (typeof p === "string" && p) password = p;
    }
  } catch {
    /* defaults */
  }

  try {
    await ensureDemoAccount(email, password);
  } catch (error) {
    console.error("[demo-enter] ensureDemoAccount failed", error);
    if (wantsJson) {
      return NextResponse.json(
        { ok: false, error: "DatabaseUnavailable" },
        { status: 503 }
      );
    }
    redirect("/?error=DatabaseUnavailable");
  }

  const result = await signInDemoCredentials(email, password, "/pool");
  if (!result.ok) {
    if (wantsJson) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: 401 }
      );
    }
    redirect(`/?error=${encodeURIComponent(result.error)}`);
  }

  if (wantsJson) {
    return NextResponse.json({ ok: true, next: "/pool" });
  }
  redirect("/pool");
}

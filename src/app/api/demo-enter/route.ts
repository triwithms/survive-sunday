import { NextResponse } from "next/server";
import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";
import { requestAbsolute } from "@/lib/request-host";

/**
 * Form + JSON demo login. Sets the Auth.js session cookie via the Next
 * cookie store, then redirects to /pool on the *request Host* (never localhost
 * leftover from next dev + x-forwarded-proto).
 */
export async function POST(req: Request) {
  const wantsJson = (req.headers.get("accept") ?? "").includes("application/json");
  let email = "aurora@survivesunday.demo";
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
    /* use defaults */
  }

  // Do not signOut first — Auth.js CSRF/cookie races on the tunnel.
  // JWT callback replaces identity on credentials sign-in.
  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
      redirectTo: "/pool",
    });
  } catch (e) {
    const code = e instanceof AuthError ? e.type : "CredentialsSignin";
    if (wantsJson) {
      return NextResponse.json({ ok: false, error: code }, { status: 401 });
    }
    const url = new URL(requestAbsolute(req, "/"));
    url.searchParams.set("error", code);
    return NextResponse.redirect(url);
  }

  if (wantsJson) {
    return NextResponse.json({ ok: true, next: "/pool" });
  }
  return NextResponse.redirect(requestAbsolute(req, "/pool"));
}

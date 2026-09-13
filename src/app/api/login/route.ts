import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { signInDemoCredentials } from "@/lib/demo-session";
import {
  loginFailurePath,
  safeLoginCallbackPath,
} from "@/lib/login-error";

/**
 * Email/password sign-in for phones (Safari).
 *
 * Native form POST + Auth.js `signIn()` + `redirect()` from next/navigation
 * so `cookies().set()` stays on the response. The client fetch to
 * `/api/auth/callback/credentials` (redirect:manual) often drops the
 * session cookie on iOS Safari — user lands back on /login with no session.
 */
export async function POST(req: Request) {
  const wantsJson = (req.headers.get("accept") ?? "").includes(
    "application/json"
  );

  let email = "";
  let password = "";
  let callbackUrl = "/pool";
  try {
    const ct = req.headers.get("content-type") ?? "";
    if (ct.includes("application/json")) {
      const body = (await req.json().catch(() => ({}))) as {
        email?: string;
        password?: string;
        callbackUrl?: string;
      };
      email = typeof body.email === "string" ? body.email : "";
      password = typeof body.password === "string" ? body.password : "";
      callbackUrl = safeLoginCallbackPath(body.callbackUrl);
    } else {
      const form = await req.formData();
      const e = form.get("email");
      const p = form.get("password");
      if (typeof e === "string") email = e;
      if (typeof p === "string") password = p;
      callbackUrl = safeLoginCallbackPath(form.get("callbackUrl"));
    }
  } catch {
    /* use defaults */
  }

  email = email.trim();
  if (!email || !password) {
    if (wantsJson) {
      return NextResponse.json(
        { ok: false, error: "MissingFields" },
        { status: 400 }
      );
    }
    redirect(loginFailurePath("MissingFields", email));
  }

  const result = await signInDemoCredentials(email, password, callbackUrl);
  if (!result.ok) {
    if (wantsJson) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: 401 }
      );
    }
    redirect(loginFailurePath(result.error, email));
  }

  if (wantsJson) {
    return NextResponse.json({ ok: true, next: callbackUrl });
  }
  redirect(callbackUrl);
}

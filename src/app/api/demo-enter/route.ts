import { NextResponse } from "next/server";
import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";
import { requestAbsolute } from "@/lib/request-host";

/**
 * Form + JSON demo login. Sets Auth.js session cookie, then 303 to a
 * same-origin handoff page (Safari often shows "can't open page" on a
 * direct POST→/pool redirect through the tunnel; refresh then works).
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
    /* defaults */
  }

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
    return NextResponse.redirect(url, 303);
  }

  if (wantsJson) {
    return NextResponse.json({ ok: true, next: "/signed-in" });
  }
  // Relative 303 — stay on the tunnel host; avoid absolute URL quirks in Safari.
  return NextResponse.redirect(new URL("/signed-in", req.url), 303);
}

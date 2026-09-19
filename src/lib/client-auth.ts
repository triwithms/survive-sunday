"use client";

import { markAddToHomePending } from "@/components/features/a2hs/actions";
import { DEFAULT_SIGNED_IN_PATH } from "@/lib/app-paths";

export type CredentialsResult = {
  ok: boolean;
  error?: string;
};

async function readJson(res: Response): Promise<Record<string, unknown> | null> {
  const ct = res.headers.get("content-type") ?? "";
  if (!ct.includes("application/json")) return null;
  try {
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function getCsrfToken(): Promise<string> {
  const res = await fetch("/api/auth/csrf", { credentials: "same-origin" });
  const data = await readJson(res);
  const token = typeof data?.csrfToken === "string" ? data.csrfToken : "";
  if (!token) {
    throw new Error(`CSRF ${res.status}`);
  }
  return token;
}

function errorFromAuthUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    return new URL(url, window.location.origin).searchParams.get("error") ?? undefined;
  } catch {
    return undefined;
  }
}

/**
 * Same-origin credentials login. Never uses next-auth/react signIn
 * (that helper throws on relative urls and will follow a localhost 302).
 */
export async function signInCredentials(
  email: string,
  password: string
): Promise<CredentialsResult> {
  try {
    try {
      const csrf = await getCsrfToken();
      await fetch("/api/auth/signout", {
        method: "POST",
        credentials: "same-origin",
        redirect: "manual",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "X-Auth-Return-Redirect": "1",
        },
        body: new URLSearchParams({ csrfToken: csrf, callbackUrl: "/" }),
      });
    } catch {
      // no existing session is fine
    }

    const csrf = await getCsrfToken();
    const res = await fetch("/api/auth/callback/credentials", {
      method: "POST",
      credentials: "same-origin",
      redirect: "manual",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "X-Auth-Return-Redirect": "1",
      },
      body: new URLSearchParams({
        csrfToken: csrf,
        email,
        password,
        callbackUrl: DEFAULT_SIGNED_IN_PATH,
        json: "true",
      }),
    });

    if (res.type !== "opaqueredirect" && res.status >= 400) {
      const data = await readJson(res);
      return {
        ok: false,
        error:
          (typeof data?.error === "string" && data.error) ||
          `HTTP ${res.status}`,
      };
    }

    if (res.type !== "opaqueredirect") {
      const data = await readJson(res);
      const url = typeof data?.url === "string" ? data.url : undefined;
      const authErr = errorFromAuthUrl(url);
      if (authErr) return { ok: false, error: authErr };
    }

    const sessionRes = await fetch("/api/auth/session", {
      credentials: "same-origin",
      cache: "no-store",
    });
    const session = await readJson(sessionRes);
    const user = session?.user as { id?: string } | undefined;
    if (!user?.id) {
      return { ok: false, error: "NoSession" };
    }
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error && e.message ? e.message : "network";
    return { ok: false, error: msg };
  }
}

/**
 * Full document load after identity change so App Router / SW cannot
 * reuse another user's RSC payload (prefetch + layout cache).
 * Always stays on the current origin — never follow a localhost leftover.
 */
export function afterAuthNavigate(path: string) {
  if (typeof window === "undefined") return;
  markAddToHomePending();
  if (path.startsWith("/")) {
    window.location.assign(path);
    return;
  }
  try {
    const u = new URL(path, window.location.origin);
    window.location.assign(
      `${window.location.origin}${u.pathname}${u.search}${u.hash}`
    );
  } catch {
    window.location.assign(DEFAULT_SIGNED_IN_PATH);
  }
}

/**
 * Native form POST to /api/login so Safari stores the session cookie.
 * Fetch + /api/auth/callback/credentials often bounces iPhone back to /login.
 */
export function submitCredentialsLogin(
  email: string,
  password: string,
  callbackUrl = DEFAULT_SIGNED_IN_PATH,
  extras?: { otp?: string }
) {
  if (typeof document === "undefined") return;
  markAddToHomePending();
  const form = document.createElement("form");
  form.method = "POST";
  form.action = "/api/login";
  form.style.display = "none";
  const otp = extras?.otp?.trim() ?? "";
  const fields: Array<[string, string]> = [
    ["email", email],
    ["callbackUrl", callbackUrl],
  ];
  if (otp && !password.trim()) {
    fields.push(["otp", otp]);
  } else {
    fields.push(["password", password]);
  }
  for (const [name, value] of fields) {
    const input = document.createElement("input");
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
}

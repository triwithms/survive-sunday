import { DEFAULT_SIGNED_IN_PATH } from "@/lib/app-paths";

/** Plain-English login errors for the Sign in screen (owner is non-technical). */

const MESSAGES: Record<string, string> = {
  CredentialsSignin:
    "That email or password is not right. Try again, or tap Forgot password.",
  OtpSignin:
    "Sign-in codes are gone. Use your email or username and password, or tap Forgot password.",
  MissingFields: "Enter your email or username and password.",
  NoSession:
    "Sign-in did not stay signed in on this phone. Refresh this page and try again on this same link.",
  Configuration:
    "Sign-in hit a server problem. Wait a moment and try again.",
  CallbackRouteError:
    "Sign-in hit a server problem. Wait a moment and try again.",
  AccessDenied: "That account is not allowed to sign in right now.",
  OAuthAccountNotLinked:
    "Use your email or username and password, or tap Forgot password.",
  OAuthCallbackError:
    "Sign-in did not finish. Use your email and password, or tap Forgot password.",
  OAuthSignInError:
    "Sign-in did not finish. Use your email and password, or tap Forgot password.",
  Verification: "That sign-in link expired. Try signing in again.",
  CSRF: "Sign-in hiccup. Refresh this page and try again.",
  MissingCSRF: "Sign-in hiccup. Refresh this page and try again.",
  Default: "Sign-in did not work. Check your email and password, then try again.",
};

export function friendlyLoginError(
  code: string | null | undefined
): string | null {
  if (!code) return null;
  const key = code.trim();
  if (!key) return null;
  return MESSAGES[key] ?? MESSAGES.Default;
}

/** Keep a typed email in the login URL after a failed attempt. Never put a password here. */
export function loginEmailQueryValue(email: string | null | undefined): string {
  const trimmed = (email ?? "").trim().slice(0, 254);
  if (!trimmed || trimmed.includes("\n") || trimmed.includes("://")) return "";
  if (trimmed.includes("@")) return trimmed.toLowerCase();
  if (/^[\w. -]{1,48}$/.test(trimmed)) return trimmed;
  return "";
}

export function loginFailurePath(
  error: string,
  email?: string | null
): string {
  const q = new URLSearchParams({ error });
  const kept = loginEmailQueryValue(email);
  if (kept) q.set("email", kept);
  return `/login?${q}`;
}

/** Same-origin relative path only — never follow a leftover localhost callback. */
export function safeLoginCallbackPath(raw: unknown): string {
  if (typeof raw !== "string") return DEFAULT_SIGNED_IN_PATH;
  const path = raw.trim();
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("://")) {
    return DEFAULT_SIGNED_IN_PATH;
  }
  if (path.startsWith("/login") || path.startsWith("/api/")) {
    return DEFAULT_SIGNED_IN_PATH;
  }
  return path;
}

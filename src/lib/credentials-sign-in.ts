import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";
import { DEFAULT_SIGNED_IN_PATH } from "@/lib/app-paths";

export type CredentialsSignInResult =
  | { ok: true }
  | { ok: false; error: string };

function errorFromResultUrl(result: unknown): string | undefined {
  if (typeof result !== "string" || !result) return undefined;
  try {
    return new URL(result, "http://localhost").searchParams.get("error") ?? undefined;
  } catch {
    return undefined;
  }
}

/**
 * Establish an Auth.js credentials session for email + password sign-in.
 *
 * Must be called from a Route Handler or Server Action so `cookies().set()`
 * from Auth.js is applied to the outgoing response. Use `redirect()` from
 * `next/navigation` afterwards — a constructed `NextResponse.redirect()`
 * drops those cookies, which is what produced `?error=NoSession`.
 *
 * `redirect: false` so we can detect CredentialsSignin and map it to
 * the login error page instead of Auth.js sending the user to `/login`.
 */
export async function signInWithCredentials(
  email: string,
  password: string,
  redirectTo = DEFAULT_SIGNED_IN_PATH
): Promise<CredentialsSignInResult> {
  try {
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      redirectTo,
    });
    const authErr = errorFromResultUrl(result);
    if (authErr) return { ok: false, error: authErr };
    // Missing AUTH_SECRET (and similar config 500s) make Auth() return the
    // callback URL with no Location and no session cookie. Do not treat that
    // as a successful sign-in.
    if (typeof result === "string" && /\/api\/auth\/callback\//.test(result)) {
      return { ok: false, error: "NoSession" };
    }
    return { ok: true };
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, error: error.type };
    }
    throw error;
  }
}

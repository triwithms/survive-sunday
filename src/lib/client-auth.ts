"use client";

import { getSession, signIn, signOut } from "next-auth/react";

export type CredentialsResult = {
  ok: boolean;
  error?: string;
};

/**
 * Replace any existing Auth.js JWT, then sign in.
 * Stacking signIn() on a live session is what made Frost briefly render as Aurora.
 */
export async function signInCredentials(
  email: string,
  password: string
): Promise<CredentialsResult> {
  try {
    await signOut({ redirect: false });
  } catch {
    // no existing session is fine
  }

  const res = await signIn("credentials", {
    email,
    password,
    redirect: false,
  });

  if (res?.error) {
    return { ok: false, error: res.error };
  }
  if (!res?.ok) {
    return { ok: false, error: "NoSession" };
  }

  const session = await getSession();
  if (!session?.user?.id) {
    return { ok: false, error: "NoSession" };
  }
  return { ok: true };
}

/**
 * Full document load after identity change so App Router / SW cannot
 * reuse another user's RSC payload (prefetch + layout cache).
 */
export function afterAuthNavigate(path: string) {
  if (typeof window === "undefined") return;
  // Always stay on the current origin — never follow a localhost
  // redirect leftover from Auth.js when we are on the tunnel.
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
    window.location.assign(path);
  }
}

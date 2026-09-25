"use client";

import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import type { ReactNode } from "react";

export function Providers({
  children,
  session,
}: {
  children: ReactNode;
  session: Session | null;
}) {
  // The server already read the JWT (root layout `auth()`). Passing it in
  // makes SessionProvider skip its mount GET /api/auth/session.
  // refetchInterval must stay 0. Auth.js 5 treats a poll as stale immediately
  // (`now() < _lastSync` does not include the interval) and getSession()
  // broadcasts on a second BroadcastChannel, so the same tab and every other
  // open tab each fetch again. A 60s interval on a handful of PWA tabs was
  // ~34k auth invocations per 12h. Nothing in the app calls useSession().
  // Sign-in, sign-out, and role view are full document loads.
  return (
    <SessionProvider
      session={session}
      refetchInterval={0}
      refetchOnWindowFocus={false}
    >
      {children}
    </SessionProvider>
  );
}

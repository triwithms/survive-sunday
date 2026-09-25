"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  // Do not remount children when the provider hydrates.
  // Identity changes already full-document-load via afterAuthNavigate / form POST.
  // No refetchInterval: nothing reads useSession(), and a timer would GET
  // /api/auth/session once a minute for every open tab (including hidden
  // ones). That alone can spend the Hobby function quota. No focus refetch
  // either — server auth() on the next navigation is what gates the app.
  return (
    <SessionProvider refetchOnWindowFocus={false}>{children}</SessionProvider>
  );
}

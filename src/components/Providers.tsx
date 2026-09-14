"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";
import { AddToHomeScreenPrompt } from "@/components/AddToHomeScreenPrompt";

export function Providers({ children }: { children: ReactNode }) {
  // Do not remount children when useSession() hydrates (undefined → user id).
  // That wipe of RSC payload shows as a blank / bounced login on Safari.
  // Identity changes already full-document-load via afterAuthNavigate / form POST.
  return (
    <SessionProvider refetchOnWindowFocus refetchInterval={60}>
      {children}
      <AddToHomeScreenPrompt />
    </SessionProvider>
  );
}

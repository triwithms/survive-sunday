"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { Fragment, type ReactNode } from "react";

function SessionGate({ children }: { children: ReactNode }) {
  const { data } = useSession();
  // Remount the tree when the signed-in user changes so client state
  // (picks, admin chrome) cannot leak across demo accounts.
  return <Fragment key={data?.user?.id ?? "anon"}>{children}</Fragment>;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus refetchInterval={60}>
      <SessionGate>{children}</SessionGate>
    </SessionProvider>
  );
}

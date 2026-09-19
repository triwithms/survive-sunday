"use client";

import Link from "next/link";
import { reopenA2hsNudge } from "@/components/features/a2hs/actions";
import { ACCOUNT_ROW } from "./account-row";

/** Same Help + A2HS path as HelpInstallLink, from Settings. */
export function AccountInstallLink() {
  return (
    <Link
      href="/help#install"
      prefetch={false}
      className={ACCOUNT_ROW}
      data-testid="account-install"
      onClick={() => reopenA2hsNudge(true)}
    >
      Install on Home Screen
    </Link>
  );
}

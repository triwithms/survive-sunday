"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PhoneEditor } from "@/components/PhoneEditor";

type Props = {
  userId: string;
  role: string;
  phoneE164: string | null;
  phoneSoftPrompt: boolean;
};

/** Header Account opens the Settings hub. Soft cell prompt stays here. */
export function AccountMenu({
  userId,
  role,
  phoneE164,
  phoneSoftPrompt,
}: Props) {
  const path = usePathname();
  const active = path === "/account" || path.startsWith("/account/");

  return (
    <>
      <Link
        href="/account"
        prefetch={false}
        aria-label="Account and Settings"
        data-testid="account-menu"
        data-user-id={userId}
        data-user-role={role}
        className={`shrink-0 inline-flex items-center justify-center min-h-11 px-3 rounded-full border text-sm font-medium touch-manipulation ${
          active
            ? "border-gold-400 text-gold-400 bg-gold-400/10"
            : "border-gold-400 text-gold-400"
        }`}
      >
        Account
      </Link>
      <PhoneEditor
        phoneE164={phoneE164}
        softPrompt={phoneSoftPrompt}
        hideTrigger
      />
    </>
  );
}

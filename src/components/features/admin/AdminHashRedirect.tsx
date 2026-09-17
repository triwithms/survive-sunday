"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Keep Account → Admin (#pool-mode) on the Pool Config screen. */
export function AdminHashRedirect() {
  const router = useRouter();
  useEffect(() => {
    if (window.location.hash === "#pool-mode") {
      router.replace("/admin/config#pool-mode");
    }
  }, [router]);
  return null;
}

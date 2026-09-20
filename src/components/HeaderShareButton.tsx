"use client";

import { usePathname } from "next/navigation";
import { ShareLinkButton } from "@/components/ShareLinkButton";
import { pageShareTitle, shouldShowHeaderShare } from "@/lib/page-share";

export function HeaderShareButton() {
  const path = usePathname();
  if (!shouldShowHeaderShare(path)) return null;

  return (
    <ShareLinkButton
      testId="header-share"
      className="shrink-0 inline-flex items-center justify-center min-h-11 min-w-11 rounded-full border border-stadium-border text-gold-400 hover:border-gold-400/60 touch-manipulation"
      getShare={() => ({
        url: window.location.href,
        title: pageShareTitle(path),
      })}
    />
  );
}

import Link from "next/link";
import { AccountMenu } from "@/components/AccountMenu";
import { HeaderHelpLink } from "@/components/HeaderHelpLink";
import { HeaderShareButton } from "@/components/HeaderShareButton";
import { HeaderWeekBadge } from "@/components/HeaderWeekBadge";
import { PoolRulesBanner } from "@/components/PoolRulesBanner";
import { DEFAULT_SIGNED_IN_PATH } from "@/lib/app-paths";
import type { AppHeaderData } from "@/app/(app)/load-app-header";

export function AppHeader(data: AppHeaderData) {
  return (
    <header
      data-share-chrome=""
      data-app-header=""
      className="sticky top-0 z-30 border-b border-stadium-border bg-stadium-900/95 backdrop-blur pt-[env(safe-area-inset-top)]"
    >
      <div className="mx-auto max-w-pool w-full px-3 sm:px-4 py-3 flex flex-wrap items-center gap-2 min-w-0">
        <Link
          href={DEFAULT_SIGNED_IN_PATH}
          prefetch={false}
          className="font-display text-base sm:text-lg tracking-wide text-gold-400 shrink-0"
        >
          SURVIVE
        </Link>
        <HeaderWeekBadge weekNumber={data.currentWeek} />
        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
          <HeaderShareButton />
          <HeaderHelpLink />
          <AccountMenu
            userId={data.userId}
            role={data.role}
            phoneE164={data.phoneE164}
            phoneSoftPrompt={data.phoneSoftPrompt}
          />
        </div>
      </div>
      <PoolRulesBanner
        singleEliminationFromWeek={data.singleEliminationFromWeek}
        compact
      />
    </header>
  );
}

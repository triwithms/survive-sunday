import { BottomNav } from "@/components/BottomNav";
import { ChromeInsets } from "@/components/ChromeInsets";
import { FooterDisclaimer } from "@/components/FooterDisclaimer";
import { AppHeader } from "@/components/AppHeader";
import { SectionBoundary } from "@/components/SectionBoundary";
import { A2hsNudge } from "@/components/features/a2hs";
import { loadAppHeader } from "./load-app-header";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

/**
 * The document scrolls (Safari Full Page screenshots, status-bar tap to top).
 * Header and tab bar are sticky. No overflow hidden/auto on any ancestor of
 * them: that makes a scrollport and they stop pinning on iOS. overflow-x-clip
 * on the content pane does not create a scrollport.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const chrome = await loadAppHeader();

  return (
    <div key={chrome.userId} className="min-h-dvh flex flex-col max-w-full">
      <AppHeader {...chrome} />
      <div className="flex-1 min-w-0 overflow-x-clip">
        <div className="mx-auto w-full max-w-pool px-3 sm:px-4 py-5 min-w-0">
          {children}
        </div>
        <SectionBoundary name="footer" variant="quiet">
          <FooterDisclaimer />
        </SectionBoundary>
      </div>
      <BottomNav isAdmin={chrome.showAdminChrome} />
      <SectionBoundary name="a2hs-nudge" variant="quiet">
        <A2hsNudge />
      </SectionBoundary>
      <SectionBoundary name="chrome-insets" variant="quiet">
        <ChromeInsets />
      </SectionBoundary>
    </div>
  );
}

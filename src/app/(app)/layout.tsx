import { BottomNav } from "@/components/BottomNav";
import { ChromeInsets } from "@/components/ChromeInsets";
import { FooterDisclaimer } from "@/components/FooterDisclaimer";
import { AppHeader } from "@/components/AppHeader";
import { A2hsNudge } from "@/components/features/a2hs";
import { loadAppHeader } from "./load-app-header";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

/**
 * Scroll model lives in globals.css (.app-shell / .app-main). Touch screens:
 * the viewport is locked and only [data-app-main] scrolls between the header
 * and tab bar. Mouse/trackpad: the document scrolls under sticky chrome.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const chrome = await loadAppHeader();

  return (
    <div key={chrome.userId} className="app-shell">
      <AppHeader {...chrome} />
      <div data-app-main="" className="app-main">
        <div className="mx-auto w-full max-w-pool px-3 sm:px-4 py-5 min-w-0">
          {children}
        </div>
        <FooterDisclaimer />
      </div>
      <BottomNav isAdmin={chrome.showAdminChrome} />
      <A2hsNudge />
      <ChromeInsets />
    </div>
  );
}

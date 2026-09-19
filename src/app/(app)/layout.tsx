import { BottomNav } from "@/components/BottomNav";
import { FooterDisclaimer } from "@/components/FooterDisclaimer";
import { AppHeader } from "@/components/AppHeader";
import { A2hsNudge } from "@/components/features/a2hs";
import { loadAppHeader } from "./load-app-header";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const chrome = await loadAppHeader();

  return (
    <div
      key={chrome.userId}
      className="h-dvh max-h-dvh flex flex-col max-w-full overflow-hidden"
    >
      <AppHeader {...chrome} />
      <div className="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden">
        <div className="mx-auto w-full max-w-pool px-3 sm:px-4 py-5 min-w-0">
          {children}
        </div>
        <FooterDisclaimer />
      </div>
      <BottomNav isAdmin={chrome.showAdminChrome} />
      <A2hsNudge />
    </div>
  );
}

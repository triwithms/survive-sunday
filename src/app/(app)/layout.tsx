import { BottomNav } from "@/components/BottomNav";
import { FooterDisclaimer } from "@/components/FooterDisclaimer";
import { AppHeader } from "@/components/AppHeader";
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
      className="min-h-dvh flex flex-col pb-24 overflow-x-hidden max-w-full"
    >
      <AppHeader {...chrome} />
      <div className="flex-1 mx-auto w-full max-w-pool px-3 sm:px-4 py-5 min-w-0 overflow-x-hidden">
        {children}
      </div>
      <FooterDisclaimer />
      <BottomNav isAdmin={chrome.showAdminChrome} />
    </div>
  );
}

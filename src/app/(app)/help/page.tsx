import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { HelpContent } from "@/components/HelpContent";

export default async function HelpPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl text-gold-400 tracking-wide">Help</h1>
      <p className="text-sm text-[var(--text-muted)]">Canadian English · 2026/27 · Wave 1 live / Wave 2 coming soon</p>
      <HelpContent />
    </div>
  );
}

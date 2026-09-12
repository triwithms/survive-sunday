import Link from "next/link";
import { FooterDisclaimer } from "@/components/FooterDisclaimer";
import { CommissionerEnter, DemoEnter } from "@/components/DemoEnter";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function LandingPage() {
  return (
    <main className="min-h-dvh flex flex-col">
      <div className="flex-1 mx-auto w-full max-w-pool px-4 pt-12 pb-8">
        <p className="text-field-400 text-sm font-medium tracking-wide uppercase mb-3">
          2026/27 NFL · en-CA
        </p>
        <h1 className="font-display text-4xl sm:text-5xl tracking-wide text-gold-400 mb-4">
          SURVIVE SUNDAY
        </h1>
        <p className="text-lg text-[var(--text-primary)] mb-6 text-balance">
          Private NFL survivor pool for friends. One pick a week. No team reuse.
          One mulligan. Last mates standing win the bragging rights.
        </p>

        <div className="mb-10">
          <DemoEnter />
        </div>

        <div className="card-glass p-4 space-y-2 text-sm text-[var(--text-muted)]">
          <p className="text-[var(--text-primary)] font-semibold">How it works</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Pick one team to win each week</li>
            <li>Can&apos;t reuse a team (win or lose)</li>
            <li>First wrong or missed pick burns your mulligan → one loss</li>
            <li>Second loss → eliminated</li>
            <li>Bye-week teams are off the board</li>
          </ul>
          <p className="pt-2 text-xs">
            Week 1 is locked history; the demo is on{" "}
            <span className="text-[var(--text-primary)]">Week 2</span> with an
            open lock — make your pick before Thursday night.
          </p>
          <p className="text-xs">
            Have an invite?{" "}
            <Link href="/join" className="text-gold-400 hover:underline">
              Join the pool
            </Link>
          </p>
        </div>

        <div className="mt-8 flex flex-col items-start gap-2 text-sm">
          <p className="text-xs text-[var(--text-muted)]">Managing the pool?</p>
          <CommissionerEnter />
          <Link
            href="/login"
            className="text-sm text-[var(--text-muted)] hover:text-gold-400"
          >
            Sign in
          </Link>
        </div>
      </div>
      <FooterDisclaimer />
    </main>
  );
}

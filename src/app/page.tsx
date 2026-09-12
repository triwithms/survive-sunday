import Link from "next/link";
import { FooterDisclaimer } from "@/components/FooterDisclaimer";
import { INVITE_CODE } from "@/lib/constants";
import { DemoEnter } from "@/components/DemoEnter";

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
        <p className="text-lg text-[var(--text-primary)] mb-2 text-balance">
          Private NFL survivor pool for friends. One pick a week. No team reuse.
          One mulligan. Last mates standing win the bragging rights.
        </p>
        <p className="text-[var(--text-muted)] mb-8">
          Lock is first kickoff. Others&apos; picks stay hidden until then. Week 1
          is already in progress — commissioners can import picks the group made
          outside the app.
        </p>

        <div className="flex flex-col gap-3 mb-10">
          <DemoEnter />
          <Link href="/join" className="btn-secondary text-center">
            Join with invite code ({INVITE_CODE})
          </Link>
          <Link href="/login" className="btn-secondary text-center">
            Sign in
          </Link>
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
        </div>
      </div>
      <FooterDisclaimer />
    </main>
  );
}

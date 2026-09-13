import Link from "next/link";
import { FooterDisclaimer } from "@/components/FooterDisclaimer";
import { CommissionerEnter, DemoEnter } from "@/components/DemoEnter";
import { isDemoMode } from "@/lib/pool-mode";
import { getPrimaryPoolMode } from "@/lib/pool-mode-db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function LandingPage() {
  const demoMode = isDemoMode(await getPrimaryPoolMode());

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

        {demoMode ? (
          <div className="mb-10">
            <DemoEnter />
          </div>
        ) : (
          <div className="mb-10 grid grid-cols-1 gap-3">
            <Link href="/join" className="btn-primary inline-flex items-center justify-center w-full">
              Join the pool
            </Link>
            <Link href="/login" className="btn-secondary inline-flex items-center justify-center w-full">
              Sign in
            </Link>
          </div>
        )}

        <div className="card-glass p-4 space-y-2 text-sm text-[var(--text-muted)]">
          <p className="text-[var(--text-primary)] font-semibold">How it works</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Pick one team to win each week</li>
            <li>Can&apos;t reuse a team (win or lose)</li>
            <li>First wrong or missed pick burns your mulligan → one loss</li>
            <li>Second loss → eliminated</li>
            <li>Bye-week teams are off the board</li>
          </ul>
          {demoMode ? (
            <p className="pt-2 text-xs">
              Week 1 is locked history; the demo is on{" "}
              <span className="text-[var(--text-primary)]">Week 2</span> with an
              open lock — make your pick before Thursday night.
            </p>
          ) : (
            <p className="pt-2 text-xs">
              The week locks at the first kickoff (often Thursday night). Get
              your pick in before then.
            </p>
          )}
          {demoMode && (
            <p className="text-xs">
              Have an invite?{" "}
              <Link href="/join" className="text-gold-400 hover:underline">
                Join the pool
              </Link>
            </p>
          )}
          <p className="text-xs pt-2">
            On your phone: add this site to your Home Screen (Safari → Share →
            Add to Home Screen, or Chrome → Install). Once you sign in, you stay
            signed in — just tap the icon. Forgot your password?{" "}
            <Link href="/login/forgot" className="text-gold-400 hover:underline">
              Reset it here
            </Link>
            .
          </p>
        </div>

        {demoMode && (
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
        )}
      </div>
      <FooterDisclaimer />
    </main>
  );
}

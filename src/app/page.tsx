import { FooterDisclaimer } from "@/components/FooterDisclaimer";
import { WhoAreYouCard } from "@/components/WhoAreYouCard";
import { listClaimableSeats } from "@/lib/claim-seat-db";
import type { ClaimableSeat } from "@/lib/claim-seat";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function LandingPage() {
  let seats: ClaimableSeat[] = [];
  try {
    seats = await listClaimableSeats();
  } catch (error) {
    console.error("[home] roster list failed", error);
  }

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

        <div className="mb-10 grid grid-cols-1 gap-3">
          <WhoAreYouCard seats={seats} />
          <Link href="/join" className="btn-primary inline-flex items-center justify-center w-full">
            Join the pool
          </Link>
          <Link href="/login" className="btn-secondary inline-flex items-center justify-center w-full">
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
          <p className="pt-2 text-xs">
            The week locks at the first kickoff (often Thursday night). Get
            your pick in before then.
          </p>
          <p className="text-xs pt-2">
            On your phone: add this site to your Home Screen (Safari → Share →
            Add to Home Screen, or Chrome → Install). Join once with your email
            and password — on this phone you should stay signed in. Use Forgot
            password only with that same email, and only after you have Joined.{" "}
            <Link href="/login/forgot" className="text-gold-400 hover:underline">
              Reset it here
            </Link>
            .
          </p>
        </div>
      </div>
      <FooterDisclaimer />
    </main>
  );
}

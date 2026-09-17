"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button, Card } from "@/components/ui";
import type { PickCensus } from "./pick-census";

export function PickCensusPanel({ census }: { census: PickCensus }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <Card as="section" className="p-4 space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-semibold">Week {census.weekNumber} pick census</h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Playing seats who still need a pick. Read-only — does not change
            the pool.
          </p>
        </div>
        <Button
          variant="secondary"
          className="w-full sm:w-auto shrink-0"
          disabled={pending}
          onClick={() => start(() => router.refresh())}
        >
          {pending ? "Refreshing…" : "Refresh"}
        </Button>
      </div>
      {census.shouldPick === 0 ? (
        <p className="text-sm" role="status">
          Nobody is due to pick this week.
        </p>
      ) : (
        <p className="text-sm" role="status">
          {census.submitted} of {census.shouldPick} have a pick.{" "}
          {census.outstanding} outstanding (no pick or missed).
        </p>
      )}
      {census.outstandingNicknames.length > 0 ? (
        <ul className="text-sm text-[var(--text-muted)] space-y-1">
          {census.outstandingNicknames.map((name) => (
            <li key={name}>{name}</li>
          ))}
        </ul>
      ) : census.shouldPick > 0 ? (
        <p className="text-sm text-field-400">Everyone due has a pick.</p>
      ) : null}
      <Link
        href="#enter-pick"
        className="btn-secondary inline-flex items-center justify-center w-full min-h-11"
      >
        Enter a friend’s pick
      </Link>
    </Card>
  );
}

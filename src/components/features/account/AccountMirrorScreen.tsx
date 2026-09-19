import Link from "next/link";
import { MirrorPicksForm } from "@/components/MirrorPicksForm";
import { Card } from "@/components/ui";
import type { AccountMirrorProps } from "./types";

export function AccountMirrorScreen(p: AccountMirrorProps) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs text-[var(--text-muted)]">
          <Link href="/account" prefetch={false} className="text-gold-400">
            ← Settings
          </Link>
        </p>
        <h1 className="font-display text-2xl text-gold-400 tracking-wide mt-1">
          Pick backup
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-2">
          Off, or ranked auto — best remaining 2025 rank team about 5 minutes
          before kickoff or lock. Path: Account (header) → Pick backup.
        </p>
      </div>
      <Card className="p-4">
        <MirrorPicksForm
          membershipId={p.membershipId}
          initialMode={p.initialMode}
        />
      </Card>
    </div>
  );
}

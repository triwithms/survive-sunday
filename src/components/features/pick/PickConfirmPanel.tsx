import { Button, Card } from "@/components/ui";
import { TeamLogo, TEAM_LOGO_SIZE } from "@/components/TeamLogo";
import { formatKickoff } from "@/lib/utils";
import { matchupFavourite, sideMeta } from "./pick-format";
import type { PickMatchup, PickSide } from "./types";

export function PickConfirmPanel({
  side,
  matchup,
  busy,
  readOnly,
  confirmLabel,
  onCancel,
  onConfirm,
}: {
  side: PickSide;
  matchup: PickMatchup;
  busy: boolean;
  readOnly: boolean;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const fav = matchupFavourite(matchup);
  const meta = sideMeta(side);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4">
      <Card className="w-full max-w-sheet p-5 space-y-3">
        <h2 className="font-semibold text-lg">Confirm pick</h2>
        <div className="flex items-center gap-3">
          <TeamLogo
            abbr={side.abbr}
            logoUrl={side.logoUrl}
            size={TEAM_LOGO_SIZE.featured}
          />
          <div>
            <p className="text-2xl font-mono text-gold-400">{side.abbr}</p>
            <p className="text-sm text-[var(--text-muted)]">{side.name}</p>
            {meta ? (
              <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">{meta}</p>
            ) : null}
          </div>
        </div>
        <p className="text-sm text-[var(--text-muted)]">
          {matchup.away.abbr} @ {matchup.home.abbr}
        </p>
        <p className="text-sm">{formatKickoff(matchup.kickoff)}</p>
        {fav ? (
          <p className="text-xs text-[var(--text-primary)]">{fav.label}</p>
        ) : null}
        <p className="text-xs text-[var(--text-muted)]">
          Odds are informational only — not for wagering.
        </p>
        <div className="flex gap-2 pt-2">
          <Button variant="secondary" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            className="flex-1"
            disabled={busy || readOnly}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </Card>
    </div>
  );
}

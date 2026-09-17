import Link from "next/link";
import { TeamLogo, TEAM_LOGO_SIZE } from "@/components/TeamLogo";
import type { BoardPickBits } from "./types";

function resultClass(result: string) {
  if (result === "win") return "text-field-400";
  if (result === "loss") return "text-crimson-400";
  return "text-[var(--text-muted)]";
}

export function BoardPickCell({
  nickname,
  pick,
  showPick,
  canEdit,
}: {
  nickname: string;
  pick: BoardPickBits | null;
  showPick: boolean;
  canEdit: boolean;
}) {
  if (!showPick) {
    return (
      <span className="text-xs text-[var(--text-muted)] italic px-1">Hidden</span>
    );
  }
  if (!pick) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-crimson-400 font-medium px-1">No pick</span>
        {canEdit ? (
          <Link
            href="/pick"
            prefetch={false}
            data-share-chrome=""
            className="btn-primary text-xs px-2.5 py-2 min-h-11"
          >
            Pick
          </Link>
        ) : null}
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <Link
        href={`/team/${pick.teamAbbr}`}
        prefetch={false}
        aria-label={`${nickname}'s pick: ${pick.teamAbbr}`}
        className="flex items-center gap-1.5 rounded-md px-1.5 py-1 min-h-11 hover:bg-gold-400/5 active:bg-gold-400/10"
      >
        <TeamLogo
          abbr={pick.teamAbbr}
          logoUrl={pick.logoUrl}
          size={TEAM_LOGO_SIZE.row}
        />
        <span className="font-mono text-base sm:text-lg font-semibold text-gold-400">
          {pick.teamAbbr}
        </span>
        {pick.result ? (
          <span className={`text-[10px] uppercase font-semibold ${resultClass(pick.result)}`}>
            {pick.result}
          </span>
        ) : null}
      </Link>
      {canEdit ? (
        <Link
          href="/pick"
          prefetch={false}
          data-share-chrome=""
          className="btn-primary text-xs px-2.5 py-2 min-h-11"
        >
          Change
        </Link>
      ) : null}
    </div>
  );
}

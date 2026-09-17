import Link from "next/link";
import { AutoPickStamps } from "@/components/AutoPickStamps";
import { TeamLogo, TEAM_LOGO_SIZE } from "@/components/TeamLogo";
import type { ScoresPickRowData } from "./screen-types";

function resultClass(result: string) {
  if (result === "win") return "text-field-400";
  if (result === "loss") return "text-crimson-400";
  return "text-[var(--text-muted)]";
}

export function ScoresPickRow({ row }: { row: ScoresPickRowData }) {
  return (
    <li
      className="card-glass p-3"
      data-share-chunk=""
      data-share-row=""
      data-status={row.status}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="font-medium min-w-0 truncate">
          {row.nickname}
          <AutoPickStamps count={row.autoPickStamps} />
          {row.isSelf ? " (you)" : ""}
          {row.realName ? (
            <span className="text-xs font-normal text-[var(--text-muted)]">
              {" "}({row.realName})
            </span>
          ) : null}
        </span>
        {row.showPick ? (
          <span className="text-sm text-right shrink-0">
            {row.teamAbbr ? (
              <>
                <Link
                  href={`/team/${row.teamAbbr}`}
                  prefetch={false}
                  className="inline-flex items-center justify-end gap-1.5 font-mono text-gold-400 underline underline-offset-2 decoration-gold-400/40"
                >
                  <TeamLogo
                    abbr={row.teamAbbr}
                    logoUrl={row.logoUrl}
                    size={TEAM_LOGO_SIZE.compact}
                  />
                  {row.teamAbbr}
                </Link>{" "}
                <span className={resultClass(row.result)}>· {row.result}</span>
              </>
            ) : (
              <span className="text-[var(--text-muted)]">{row.noPickLabel}</span>
            )}
          </span>
        ) : (
          <span className="text-sm text-[var(--text-muted)] italic shrink-0">
            Reveals after kickoff
          </span>
        )}
      </div>
    </li>
  );
}

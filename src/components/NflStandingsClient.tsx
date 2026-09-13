"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { TeamLogo } from "@/components/TeamLogo";
import {
  DIVISION_ORDER,
  formatWinPct,
  winPct,
} from "@/lib/standings-format";

export type StandingRow = {
  abbr: string;
  name: string;
  logoUrl: string | null;
  conference: string;
  division: string;
  wins: number;
  losses: number;
  ties: number;
  divisionRank: number | null;
  pointsFor: number;
  pointsAgainst: number;
  priorYearRank: number | null;
};

function record(t: StandingRow): string {
  if (t.ties > 0) return `${t.wins}-${t.losses}-${t.ties}`;
  return `${t.wins}-${t.losses}`;
}

function StandingTable({
  rows,
  showDivisionCol,
}: {
  rows: StandingRow[];
  showDivisionCol?: boolean;
}) {
  return (
    <div className="overflow-x-auto -mx-1 px-1">
      <table className="w-full min-w-[28rem] text-left text-sm">
        <thead>
          <tr className="text-[10px] uppercase tracking-wide text-[var(--text-muted)] border-b border-stadium-border">
            <th className="py-2 pr-2 font-medium w-8">#</th>
            <th className="py-2 pr-2 font-medium">Team</th>
            {showDivisionCol && (
              <th className="py-2 pr-2 font-medium hidden sm:table-cell">Div</th>
            )}
            <th className="py-2 pr-2 font-medium font-mono">W-L-T</th>
            <th className="py-2 pr-2 font-medium font-mono">Pct</th>
            <th className="py-2 pr-2 font-medium font-mono">PF</th>
            <th className="py-2 pr-2 font-medium font-mono">PA</th>
            <th
              className="py-2 font-medium whitespace-nowrap"
              title="2025 composite power rank — 1 strongest, 32 weakest"
            >
              2025 rank
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t, i) => (
            <tr
              key={t.abbr}
              className="border-b border-stadium-border/60 last:border-0"
            >
              <td className="py-2 pr-2 text-[var(--text-muted)] font-mono text-xs">
                {t.divisionRank ?? i + 1}
              </td>
              <td className="py-2 pr-2">
                <Link
                  href={`/team/${t.abbr}`}
                  prefetch={false}
                  className="inline-flex items-center gap-2 min-h-11 min-w-0 py-1 hover:text-gold-400"
                >
                  <TeamLogo abbr={t.abbr} logoUrl={t.logoUrl} size={28} />
                  <span className="font-mono font-semibold text-gold-400">
                    {t.abbr}
                  </span>
                  <span className="truncate text-xs text-[var(--text-muted)] hidden xs:inline max-w-[7rem] sm:max-w-[10rem]">
                    {t.name.replace(/^(Arizona|Atlanta|Baltimore|Buffalo|Carolina|Chicago|Cincinnati|Cleveland|Dallas|Denver|Detroit|Green Bay|Houston|Indianapolis|Jacksonville|Kansas City|Las Vegas|Los Angeles|Miami|Minnesota|New England|New Orleans|New York|Philadelphia|Pittsburgh|San Francisco|Seattle|Tampa Bay|Tennessee|Washington)\s/, "")}
                  </span>
                </Link>
              </td>
              {showDivisionCol && (
                <td className="py-2 pr-2 text-xs text-[var(--text-muted)] hidden sm:table-cell whitespace-nowrap">
                  {t.conference} {t.division}
                </td>
              )}
              <td className="py-2 pr-2 font-mono text-xs whitespace-nowrap">
                {record(t)}
              </td>
              <td className="py-2 pr-2 font-mono text-xs">
                {formatWinPct(t.wins, t.losses, t.ties)}
              </td>
              <td className="py-2 pr-2 font-mono text-xs">{t.pointsFor}</td>
              <td className="py-2 pr-2 font-mono text-xs">{t.pointsAgainst}</td>
              <td
                className="py-2 font-mono text-xs text-[var(--text-muted)]"
                title={
                  t.priorYearRank != null
                    ? `2025 power rank #${t.priorYearRank} (1 = strongest)`
                    : undefined
                }
              >
                {t.priorYearRank != null ? `#${t.priorYearRank}` : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function NflStandingsClient({
  teams,
  asOf,
  note,
  demoMode = false,
}: {
  teams: StandingRow[];
  asOf?: string;
  note?: string;
  demoMode?: boolean;
}) {
  const [tab, setTab] = useState<"division" | "overall" | "afc" | "nfc">(
    "division"
  );

  const byDivision = useMemo(() => {
    return DIVISION_ORDER.map(({ conference, division }) => ({
      conference,
      division,
      label: `${conference} ${division}`,
      rows: teams
        .filter((t) => t.conference === conference && t.division === division)
        .sort(
          (a, b) =>
            (a.divisionRank ?? 99) - (b.divisionRank ?? 99) ||
            winPct(b.wins, b.losses, b.ties) -
              winPct(a.wins, a.losses, a.ties)
        ),
    }));
  }, [teams]);

  const overall = useMemo(() => {
    return [...teams].sort((a, b) => {
      const pa = winPct(a.wins, a.losses, a.ties);
      const pb = winPct(b.wins, b.losses, b.ties);
      if (pb !== pa) return pb - pa;
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.pointsFor !== a.pointsFor) return b.pointsFor - a.pointsFor;
      return (a.priorYearRank ?? 99) - (b.priorYearRank ?? 99);
    });
  }, [teams]);

  const afc = useMemo(
    () => overall.filter((t) => t.conference === "AFC"),
    [overall]
  );
  const nfc = useMemo(
    () => overall.filter((t) => t.conference === "NFC"),
    [overall]
  );

  const tabs: { id: typeof tab; label: string }[] = [
    { id: "division", label: "By division" },
    { id: "overall", label: "Overall" },
    { id: "afc", label: "AFC" },
    { id: "nfc", label: "NFC" },
  ];

  return (
    <div className="space-y-4 min-w-0">
      <div
        role="tablist"
        aria-label="Standings view"
        className="flex flex-wrap gap-1.5"
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`chip text-xs ${
              tab === t.id ? "chip-gold" : "chip-one-loss"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <p className="text-xs text-[var(--text-muted)]">
        {demoMode && <span className="chip chip-gold mr-2">Demo standings</span>}
        {asOf ? `As of ${asOf}. ` : ""}
        {demoMode
          ? note || "Not a live NFL API feed."
          : "Research table for picking — not an official NFL feed."}
      </p>
      <p className="text-xs text-[var(--text-muted)]">
        <span className="font-medium text-[var(--text-primary)]">2025 rank</span>
        {" "}
        = last season’s composite power rank by team (1 = strongest, 32 =
        weakest). Used for research next to each club — not this year’s W-L.
      </p>

      {tab === "division" && (
        <div className="space-y-4">
          {byDivision.map((d) => (
            <section key={d.label} className="card-glass p-3 sm:p-4 min-w-0">
              <h2 className="font-display text-lg text-gold-400 tracking-wide mb-2">
                {d.label}
              </h2>
              <StandingTable rows={d.rows} />
            </section>
          ))}
        </div>
      )}

      {tab === "overall" && (
        <section className="card-glass p-3 sm:p-4 min-w-0">
          <h2 className="font-display text-lg text-gold-400 tracking-wide mb-2">
            League overall (1–32)
          </h2>
          <StandingTable
            rows={overall.map((t, i) => ({ ...t, divisionRank: i + 1 }))}
            showDivisionCol
          />
        </section>
      )}

      {tab === "afc" && (
        <section className="card-glass p-3 sm:p-4 min-w-0">
          <h2 className="font-display text-lg text-gold-400 tracking-wide mb-2">
            AFC
          </h2>
          <StandingTable
            rows={afc.map((t, i) => ({ ...t, divisionRank: i + 1 }))}
            showDivisionCol
          />
        </section>
      )}

      {tab === "nfc" && (
        <section className="card-glass p-3 sm:p-4 min-w-0">
          <h2 className="font-display text-lg text-gold-400 tracking-wide mb-2">
            NFC
          </h2>
          <StandingTable
            rows={nfc.map((t, i) => ({ ...t, divisionRank: i + 1 }))}
            showDivisionCol
          />
        </section>
      )}
    </div>
  );
}

import { auth } from "@/lib/auth";
import { getMembershipForUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { NflStandingsClient } from "@/components/NflStandingsClient";
import { isDemoMode } from "@/lib/pool-mode";
import fs from "fs";
import path from "path";
import { syncTeamStandingsFromEspn } from "@/lib/espn-standings";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Demo-only meta from seed file — never show on Real/live player screens. */
function demoStandingsMeta(): { asOf?: string; note?: string } {
  const dirs = [
    path.resolve(process.cwd(), "data"),
    path.resolve("/workspace/survive-sunday/app/data"),
    path.resolve("/workspace/survive-sunday/data"),
  ];
  for (const dir of dirs) {
    const p = path.join(dir, "week2-standings.json");
    if (fs.existsSync(p)) {
      const raw = JSON.parse(fs.readFileSync(p, "utf8")) as {
        as_of?: string;
        note?: string;
      };
      return { asOf: raw.as_of, note: raw.note };
    }
  }
  return {};
}

export default async function NflStandingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const me = await getMembershipForUser(session.user.id);
  if (!me) redirect("/join");

  const demoMode = isDemoMode(me.pool.mode);

  // Real mode: refresh Team W-L from ESPN so BUF etc. match live results.
  if (!demoMode) {
    try {
      await syncTeamStandingsFromEspn();
    } catch (e) {
      console.error("nfl standings ESPN sync skipped", e);
    }
  }

  const teams = await prisma.team.findMany({
    orderBy: [{ conference: "asc" }, { division: "asc" }, { divisionRank: "asc" }],
  });
  const meta = demoMode ? demoStandingsMeta() : {};

  return (
    <div className="space-y-5 min-w-0">
      <div>
        <h1 className="font-display text-2xl text-gold-400 tracking-wide">
          NFL standings
        </h1>
        <p className="text-sm text-[var(--text-muted)]">
          {demoMode
            ? "Demo league table · tap a team for research · "
            : "Live league table · tap a team for research · "}
          <Link href="/standings" prefetch={false} className="text-gold-400 underline underline-offset-2">
            pool survival board
          </Link>
        </p>
      </div>

      <NflStandingsClient
        demoMode={demoMode}
        asOf={meta.asOf}
        note={meta.note}
        teams={teams.map((t) => ({
          abbr: t.abbr,
          name: t.name,
          logoUrl: t.logoUrl,
          conference: t.conference,
          division: t.division,
          wins: t.wins,
          losses: t.losses,
          ties: t.ties,
          divisionRank: t.divisionRank,
          pointsFor: t.pointsFor,
          pointsAgainst: t.pointsAgainst,
          priorYearRank: t.priorYearRank,
        }))}
      />
    </div>
  );
}

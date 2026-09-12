import { auth } from "@/lib/auth";
import { getMembershipForUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { NflStandingsClient } from "@/components/NflStandingsClient";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function standingsMeta(): { asOf?: string; note?: string } {
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

  const teams = await prisma.team.findMany({
    orderBy: [{ conference: "asc" }, { division: "asc" }, { divisionRank: "asc" }],
  });
  const meta = standingsMeta();

  return (
    <div className="space-y-5 min-w-0">
      <div>
        <h1 className="font-display text-2xl text-gold-400 tracking-wide">
          NFL standings
        </h1>
        <p className="text-sm text-[var(--text-muted)]">
          Week-2-ish league table · tap a team for research ·{" "}
          <Link href="/standings" prefetch={false} className="text-gold-400 underline underline-offset-2">
            pool survival board
          </Link>
        </p>
      </div>

      <NflStandingsClient
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

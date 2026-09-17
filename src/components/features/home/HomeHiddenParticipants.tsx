import Link from "next/link";
import { HomeParticipantItem } from "./HomeParticipantItem";
import type { HomeRow } from "./types";

const GROUPS = [
  { key: "undefeated", label: "Undefeated" },
  { key: "one_loss", label: "One loss" },
  { key: "eliminated", label: "Eliminated" },
] as const;

function resultClass(result: string | null) {
  if (result === "win") return " text-field-400";
  if (result === "loss") return " text-crimson-400";
  return " text-[var(--text-muted)]";
}

function HiddenPickDetail({ row, isSelf }: { row: HomeRow; isSelf: boolean }) {
  if (!isSelf) {
    return (
      <p className="text-sm text-[var(--text-muted)] mt-1 italic">
        Reveals after kickoff
      </p>
    );
  }
  if (!row.pick) {
    return <p className="text-sm text-[var(--text-muted)] mt-1">No pick</p>;
  }
  const pick = row.pick;
  return (
    <div className="mt-1 text-sm">
      <Link
        href={`/team/${pick.teamAbbr}`}
        prefetch={false}
        className="font-mono text-gold-400 underline underline-offset-2 decoration-gold-400/40 hover:decoration-gold-400"
      >
        {pick.teamAbbr}
      </Link>
      {pick.game ? (
        <span className="text-[var(--text-muted)]">
          {" "}· {pick.game.awayAbbr} @ {pick.game.homeAbbr}
        </span>
      ) : null}
      {pick.result ? (
        <span className={resultClass(pick.result)}> · {pick.result}</span>
      ) : null}
      {pick.source === "imported" ? (
        <span className="text-[var(--text-muted)]"> · imported</span>
      ) : null}
    </div>
  );
}

export function HomeHiddenParticipants({
  rows,
  selfId,
}: {
  rows: HomeRow[];
  selfId: string;
}) {
  return (
    <section>
      <h2 className="text-lg font-semibold mb-3">Participants</h2>
      <div className="space-y-5">
        {GROUPS.map((group) => {
          const groupRows = rows.filter((row) => row.status === group.key);
          if (!groupRows.length) return null;
          return (
            <div key={group.key}>
              <h3 className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-2">
                {group.label}
              </h3>
              <ul className="space-y-2">
                {groupRows.map((row) => (
                  <HomeParticipantItem
                    key={row.id}
                    row={row}
                    isSelf={row.id === selfId}
                    below={
                      <HiddenPickDetail row={row} isSelf={row.id === selfId} />
                    }
                  />
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}

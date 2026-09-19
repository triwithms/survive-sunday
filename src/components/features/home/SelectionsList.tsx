import { BoardPickCell } from "@/components/features/board/BoardPickCell";
import { Card } from "@/components/ui";
import { AutoPickStamps } from "@/components/AutoPickStamps";
import { teamLogoUrl } from "@/lib/espn-teams";
import { sortSelections } from "./sort-selections";
import type { HomeRow } from "./types";

export function SelectionsList({
  rows,
  selfId,
  revealAllPicks,
}: {
  rows: HomeRow[];
  selfId: string;
  revealAllPicks: boolean;
}) {
  return (
    <section>
      <h2 className="text-lg font-semibold mb-3">Everyone’s picks</h2>
      <ul className="space-y-2">
        {sortSelections(rows).map((row) => {
          const isSelf = row.id === selfId;
          return (
            <Card
              as="li"
              key={row.id}
              className="p-3 flex items-center gap-3 min-w-0"
            >
              <div className="flex-1 min-w-0 overflow-hidden">
                <div className="font-medium truncate">
                  {row.nickname}
                  <AutoPickStamps count={row.autoPickStamps} />
                  {isSelf ? " (you)" : ""}
                </div>
              </div>
              <BoardPickCell
                nickname={row.nickname}
                pick={
                  row.pick
                    ? {
                        teamAbbr: row.pick.teamAbbr,
                        result: row.pick.result,
                        logoUrl: teamLogoUrl(row.pick.teamAbbr),
                      }
                    : null
                }
                showPick={revealAllPicks || isSelf}
                canEdit={false}
              />
            </Card>
          );
        })}
      </ul>
    </section>
  );
}

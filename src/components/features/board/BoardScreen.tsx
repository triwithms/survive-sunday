import { BoardHeading } from "./BoardHeading";
import { BoardParticipantRow } from "./BoardParticipantRow";
import { BoardPickCell } from "./BoardPickCell";
import { BoardTiebreak } from "./BoardTiebreak";
import type { BoardScreenProps } from "./types";

export function BoardScreen({
  heading,
  rows,
  selfId,
  revealAllPicks,
  canChangePick,
  oneAndDone,
  tiebreak,
}: BoardScreenProps) {
  return (
    <div
      id="share-board"
      data-share-root="board"
      data-share-week={heading.weekLabel}
      className="space-y-6 min-w-0"
    >
      <BoardHeading {...heading} />
      <ul className="space-y-2">
        {rows.map((row, index) => {
          const isSelf = row.id === selfId;
          return (
            <BoardParticipantRow
              key={row.id}
              rank={index + 1}
              nickname={row.nickname}
              autoPickStamps={row.autoPickStamps}
              isSelf={isSelf}
              realName={row.realName}
              status={row.status}
              meta={`Losses: ${row.losses} · Weeks survived: ${row.weeksSurvived}${
                !row.mulliganRemaining
                  ? " · Mulligan used"
                  : oneAndDone
                    ? " · One-and-done"
                    : ""
              }`}
            >
              <BoardPickCell
                nickname={row.nickname}
                pick={row.pick}
                showPick={revealAllPicks || isSelf}
                canEdit={isSelf && canChangePick && row.status !== "eliminated"}
              />
            </BoardParticipantRow>
          );
        })}
      </ul>
      <BoardTiebreak {...tiebreak} />
    </div>
  );
}

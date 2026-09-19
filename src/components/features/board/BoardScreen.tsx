import { BoardHeading } from "./BoardHeading";
import { BoardParticipantRow } from "./BoardParticipantRow";
import { BoardTiebreak } from "./BoardTiebreak";
import type { BoardScreenProps } from "./types";

export function BoardScreen({
  heading,
  rows,
  selfId,
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
        {rows.map((row, index) => (
          <BoardParticipantRow
            key={row.id}
            rank={index + 1}
            nickname={row.nickname}
            autoPickStamps={row.autoPickStamps}
            isSelf={row.id === selfId}
            realName={row.realName}
            status={row.status}
            meta={`Losses: ${row.losses} · Weeks survived: ${row.weeksSurvived}${
              !row.mulliganRemaining
                ? " · Mulligan used"
                : oneAndDone
                  ? " · One-and-done"
                  : ""
            }`}
          />
        ))}
      </ul>
      <BoardTiebreak {...tiebreak} />
    </div>
  );
}

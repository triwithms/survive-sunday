export function BoardTiebreak({
  soleNickname,
  sharedNicknames,
  showNoOfficial,
}: {
  soleNickname: string | null;
  sharedNicknames: string[];
  showNoOfficial: boolean;
}) {
  return (
    <>
      <details
        className="group card-glass p-4 text-sm space-y-2 min-w-0"
        data-share-chunk=""
        data-share-section="tiebreak"
      >
        <summary className="font-semibold text-gold-400 min-h-11 cursor-pointer py-1 list-none [&::-webkit-details-marker]:hidden [&::marker]:hidden">
          Season-end tiebreak
          <span className="font-normal text-[var(--text-muted)] group-open:hidden">
            {" "}
            ▾
          </span>
          <span className="font-normal text-[var(--text-muted)] hidden group-open:inline">
            {" "}
            Hide
          </span>
        </summary>
        <p className="text-[var(--text-muted)]">
          Official winner must have a <strong>clean</strong> season — no
          ranked auto-pick 💩. Manual / imported picks do not stamp. Auto-pick
          is for staying in for fun when you left it too late. Among eligible
          players: fewest losses → most weeks survived → shared win if still
          tied.
        </p>
        {soleNickname ? (
          <p className="break-words">
            Current official sole leader:{" "}
            <span className="text-gold-400">{soleNickname}</span>
          </p>
        ) : null}
        {!soleNickname && sharedNicknames.length > 0 ? (
          <p className="break-words">
            Shared official lead: {sharedNicknames.join(", ")}
          </p>
        ) : null}
        {showNoOfficial ? (
          <p className="text-[var(--text-muted)]">
            No official leader — remaining players used the ~5-minute
            best-ranked auto-pick (💩).
          </p>
        ) : null}
      </details>
      <p
        data-share-stamp=""
        className="text-[11px] text-[var(--text-muted)] pt-1"
      >
        Survive Sunday · for friends, not betting
      </p>
    </>
  );
}

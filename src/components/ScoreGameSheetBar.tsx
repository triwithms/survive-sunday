import { ScoreGameShareButton } from "@/components/ScoreGameShareButton";

/** Sheet title + Share (matchup URL) + Close. Header Share stays behind the sheet. */
export function ScoreGameSheetBar({
  titleId,
  awayAbbr,
  homeAbbr,
  gameId,
  weekNumber,
  onClose,
}: {
  titleId: string;
  awayAbbr: string;
  homeAbbr: string;
  gameId: string;
  weekNumber: number;
  onClose: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <h2
        id={titleId}
        className="font-display text-lg text-gold-400 tracking-wide"
      >
        {awayAbbr} @ {homeAbbr}
      </h2>
      <div className="flex items-center shrink-0">
        <ScoreGameShareButton
          gameId={gameId}
          weekNumber={weekNumber}
          awayAbbr={awayAbbr}
          homeAbbr={homeAbbr}
        />
        <button
          type="button"
          className="text-sm text-gold-400 min-h-11 px-2"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
}

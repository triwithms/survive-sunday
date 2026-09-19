import type { TeamCoachResult } from "@/lib/team-coaches";

export function TeamCoachLinks({
  coach,
  fallback,
  abbr,
}: {
  coach: TeamCoachResult;
  fallback?: boolean;
  abbr?: string;
}) {
  const gold = fallback
    ? "text-gold-400 underline underline-offset-2"
    : "text-gold-400 underline underline-offset-2";
  const muted =
    "text-[var(--text-muted)] underline underline-offset-2 hover:text-gold-400";
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-2 text-base pt-1">
      {coach.espnCoachUrl && (
        <li>
          <a href={coach.espnCoachUrl} target="_blank" rel="noopener noreferrer" className={gold}>
            ESPN profile
          </a>
        </li>
      )}
      {coach.wikipediaUrl && (
        <li>
          <a href={coach.wikipediaUrl} target="_blank" rel="noopener noreferrer" className={gold}>
            Wikipedia
          </a>
        </li>
      )}
      <li>
        <a href={coach.espnTeamUrl} target="_blank" rel="noopener noreferrer" className={fallback ? gold : muted}>
          {fallback && abbr ? `ESPN · ${abbr}` : "ESPN team page"}
        </a>
      </li>
      <li>
        <a href={coach.nflTeamUrl} target="_blank" rel="noopener noreferrer" className={fallback ? gold : muted}>
          {fallback && abbr ? `NFL.com · ${abbr}` : "NFL.com team page"}
        </a>
      </li>
    </ul>
  );
}

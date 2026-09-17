import Link from "next/link";
import { TeamLogo, TEAM_LOGO_SIZE } from "@/components/TeamLogo";

export function ScoreTeamRow({
  abbr,
  logoUrl,
  score,
  leading,
  live,
  hasBall,
}: {
  abbr: string;
  logoUrl: string | null;
  score: number | null;
  leading: boolean;
  live: boolean;
  hasBall: boolean;
}) {
  return (
    <Link
      href={`/team/${abbr}`}
      prefetch={false}
      className={`relative z-10 flex items-center gap-1.5 sm:gap-2 min-h-11 min-w-0 rounded-md px-1.5 -mx-0.5 hover:bg-gold-400/5 active:bg-gold-400/10 ${
        hasBall
          ? "border-l-[3px] border-gold-400 bg-gold-400/5"
          : "border-l-[3px] border-transparent"
      }`}
      aria-label={`Team details for ${abbr}${hasBall ? ", has the ball" : ""}`}
      onClick={(e) => e.stopPropagation()}
    >
      <TeamLogo abbr={abbr} logoUrl={logoUrl} size={TEAM_LOGO_SIZE.compact} />
      <span
        className={`font-mono text-sm font-semibold ${
          leading ? "text-field-400" : "text-[var(--text-primary)]"
        }`}
      >
        {abbr}
      </span>
      {hasBall ? (
        <span
          className="shrink-0 text-[13px] leading-none"
          title="Has the ball"
          aria-hidden
        >
          🏈
        </span>
      ) : null}
      <span
        className={`ml-auto w-9 text-right font-mono text-xl tabular-nums ${
          live && score != null ? "text-gold-400" : ""
        } ${leading ? "font-semibold" : ""}`}
      >
        {score != null ? score : "–"}
      </span>
    </Link>
  );
}

import { teamBadge } from "@/lib/team-badges";
import { TEAM_LOGO_SIZE } from "@/lib/team-logo-size";

export { TEAM_LOGO_SIZE };

export function TeamLogo({
  abbr,
  size = TEAM_LOGO_SIZE.compact,
}: {
  abbr: string;
  logoUrl?: string | null;
  size?: number;
}) {
  const badge = teamBadge(abbr);
  const fontSize = badge.abbr.length > 2 ? 16 : 22;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className="shrink-0"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <circle
        cx="32"
        cy="32"
        r="30"
        fill={badge.primary}
        stroke={badge.secondary}
        strokeWidth="4"
      />
      <text
        x="32"
        y="34"
        textAnchor="middle"
        dominantBaseline="middle"
        fill={badge.letter}
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontSize={fontSize}
        fontWeight="700"
      >
        {badge.abbr}
      </text>
    </svg>
  );
}

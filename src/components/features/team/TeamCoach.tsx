import type { TeamCoachResult } from "@/lib/team-coaches";
import { TeamCoachLinks } from "./TeamCoachLinks";

export function TeamCoach({
  coach,
  abbr,
}: {
  coach: TeamCoachResult;
  abbr: string;
}) {
  return (
    <section className="card-glass p-4 space-y-2">
      <h2 className="text-xl font-semibold text-gold-400">Coach</h2>
      {coach.name ? (
        <>
          <p className="text-lg font-medium break-words">{coach.name}</p>
          {coach.experienceLabel && (
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">
              {coach.experienceLabel}
            </p>
          )}
          <TeamCoachLinks coach={coach} />
          <p className="text-sm text-[var(--text-muted)] leading-relaxed pt-1">
            Head coach from ESPN. Opens in a new tab.
          </p>
        </>
      ) : (
        <div className="space-y-2 text-base text-[var(--text-muted)]">
          <p>
            Coach name isn&apos;t listed right now. Look them up on the team
            pages:
          </p>
          <TeamCoachLinks coach={coach} fallback abbr={abbr} />
        </div>
      )}
    </section>
  );
}

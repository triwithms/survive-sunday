/**
 * Season-end tiebreak helpers (en-CA).
 * Prefer sole survivor; if multiple remain alive, shared win with:
 * 1. Fewest losses
 * 2. Most weeks survived
 * 3. Nickname A–Z (en-CA)
 */
export type AliveMember = {
  nickname: string;
  status: string;
  losses: number;
  weeksSurvived: number;
};

export function isAlive(status: string): boolean {
  return status === "undefeated" || status === "one_loss";
}

export function sortParticipants<T extends { status: string; nickname: string }>(
  members: T[]
): T[] {
  const order: Record<string, number> = {
    undefeated: 0,
    one_loss: 1,
    eliminated: 2,
  };
  return [...members].sort((a, b) => {
    const sa = order[a.status] ?? 9;
    const sb = order[b.status] ?? 9;
    if (sa !== sb) return sa - sb;
    return a.nickname.localeCompare(b.nickname, "en-CA");
  });
}

export function resolveSeasonWinners(alive: AliveMember[]): {
  sole: AliveMember | null;
  shared: AliveMember[];
  ranked: AliveMember[];
} {
  const living = alive.filter((m) => isAlive(m.status));
  if (living.length === 0) {
    return { sole: null, shared: [], ranked: [] };
  }
  const ranked = [...living].sort((a, b) => {
    if (a.losses !== b.losses) return a.losses - b.losses;
    if (a.weeksSurvived !== b.weeksSurvived)
      return b.weeksSurvived - a.weeksSurvived;
    return a.nickname.localeCompare(b.nickname, "en-CA");
  });
  if (ranked.length === 1) {
    return { sole: ranked[0], shared: [], ranked };
  }
  const best = ranked[0];
  const tied = ranked.filter(
    (m) =>
      m.losses === best.losses && m.weeksSurvived === best.weeksSurvived
  );
  if (tied.length === 1) {
    return { sole: tied[0], shared: [], ranked };
  }
  return { sole: null, shared: tied, ranked };
}

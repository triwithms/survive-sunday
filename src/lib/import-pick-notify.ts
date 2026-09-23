/**
 * Same pickConfirmed rule as writeUserPick: first save or a different team
 * notifies; re-importing the identical team does not.
 */
export function importPickConfirmedChange(
  existing: { teamAbbr: string } | null | undefined,
  teamAbbr: string
): { changed: boolean } | null {
  if (existing && existing.teamAbbr === teamAbbr) return null;
  return { changed: Boolean(existing && existing.teamAbbr !== teamAbbr) };
}

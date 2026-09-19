import type { HomeRow } from "./types";

/** Group-pick list: same team together, then nickname A–Z. No-pick last. Not the in/out race. */
export function sortSelections(rows: HomeRow[]): HomeRow[] {
  return [...rows].sort((a, b) => {
    const aPick = a.pick?.teamAbbr ?? "";
    const bPick = b.pick?.teamAbbr ?? "";
    if (!aPick && bPick) return 1;
    if (aPick && !bPick) return -1;
    const pickCmp = aPick.localeCompare(bPick);
    if (pickCmp !== 0) return pickCmp;
    return a.nickname.localeCompare(b.nickname, "en-CA");
  });
}

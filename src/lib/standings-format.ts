/** Client-safe standings helpers (no Node fs). */

export function winPct(wins: number, losses: number, ties: number): number {
  const g = wins + losses + ties;
  if (g === 0) return 0;
  return (wins + ties * 0.5) / g;
}

export function formatWinPct(wins: number, losses: number, ties: number): string {
  return winPct(wins, losses, ties).toFixed(3).replace(/^0/, "");
}

export const DIVISION_ORDER = [
  { conference: "AFC", division: "East" },
  { conference: "AFC", division: "North" },
  { conference: "AFC", division: "South" },
  { conference: "AFC", division: "West" },
  { conference: "NFC", division: "East" },
  { conference: "NFC", division: "North" },
  { conference: "NFC", division: "South" },
  { conference: "NFC", division: "West" },
] as const;

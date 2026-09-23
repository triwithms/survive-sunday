import {
  WEEK_WRAP_TONES,
  type WeekWrapBlocks,
  type WeekWrapTone,
} from "./week-wrap-types";

export function isWeekWrapTone(value: unknown): value is WeekWrapTone {
  return (
    typeof value === "string" &&
    (WEEK_WRAP_TONES as readonly string[]).includes(value)
  );
}

export function parseSkippedWeeks(json: string | null | undefined): number[] {
  try {
    const arr = JSON.parse(json || "[]");
    if (!Array.isArray(arr)) return [];
    return arr.filter((n) => Number.isInteger(n) && n > 0);
  } catch {
    return [];
  }
}

export function parseWeekWrapBlocks(value: unknown): WeekWrapBlocks {
  const row =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};
  const flag = (key: keyof WeekWrapBlocks) =>
    typeof row[key] === "boolean" ? (row[key] as boolean) : true;
  return {
    roster: flag("roster"),
    picks: flag("picks"),
    board: flag("board"),
    drama: flag("drama"),
  };
}

export function withSkippedWeek(
  weeks: number[],
  weekNumber: number,
  skip: boolean
): number[] {
  const set = new Set(weeks);
  if (skip) set.add(weekNumber);
  else set.delete(weekNumber);
  return [...set].sort((a, b) => a - b);
}

export function weekNumbersFromDedupeKeys(
  keys: string[],
  poolId: string
): Set<number> {
  const set = new Set<number>();
  const prefix = `wrap:${poolId}:w`;
  for (const key of keys) {
    if (!key.startsWith(prefix)) continue;
    const num = Number.parseInt(key.slice(prefix.length), 10);
    if (Number.isInteger(num) && num > 0) set.add(num);
  }
  return set;
}

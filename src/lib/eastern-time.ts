export const EASTERN_TIME_ZONE = "America/New_York";
export const EASTERN_TIME_SUFFIX = "ET";

type EasternInput = Date | string | number | null | undefined;

function asDate(input: EasternInput): Date | null {
  if (input == null) return null;
  const date = input instanceof Date ? input : new Date(input);
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
  return date;
}

export function formatEasternDateTime(
  input: EasternInput,
  options: Intl.DateTimeFormatOptions,
  includeSuffix = true
): string {
  const date = asDate(input);
  if (!date) return "";
  try {
    const formatted = new Intl.DateTimeFormat("en-CA", {
      ...options,
      timeZone: EASTERN_TIME_ZONE,
    }).format(date);
    return includeSuffix ? `${formatted} ${EASTERN_TIME_SUFFIX}` : formatted;
  } catch {
    return "";
  }
}

export const FORGOT_INTRO =
  "We’ll email a 6-digit code, and text it too if you saved a cell. Then you pick a new password. Check inbox and spam/junk — codes may be filtered.";

export function sentCodeCopy(alsoSms: boolean): string {
  if (alsoSms) {
    return "We emailed a 6-digit code and texted it too. Check your inbox and spam/junk — codes may be filtered.";
  }
  return "We emailed a 6-digit code. Check your inbox and spam/junk — codes may be filtered.";
}

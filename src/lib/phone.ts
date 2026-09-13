/**
 * Canadian-friendly phone normalize → E.164 (+1XXXXXXXXXX).
 * Accepts (416) 951-4262, 416-951-4262, +1…, 1XXXXXXXXXX, etc.
 */

const E164_CA_US = /^\+1\d{10}$/;

/** Strip to digits only. */
export function digitsOnly(input: string): string {
  return input.replace(/\D/g, "");
}

/**
 * Normalize user input to +1XXXXXXXXXX or return null if invalid.
 * Assumes North America (+1); 10-digit local or 11-digit leading 1.
 */
export function normalizeToE164(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Already E.164-ish with +
  if (trimmed.startsWith("+")) {
    const digits = digitsOnly(trimmed);
    if (digits.length === 11 && digits.startsWith("1")) {
      return `+${digits}`;
    }
    return null;
  }

  const digits = digitsOnly(trimmed);
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }
  return null;
}

export function isValidE164CaUs(value: string): boolean {
  return E164_CA_US.test(value);
}

/** Display-friendly: +1 (416) 951-4262 */
export function formatPhoneDisplay(e164: string | null | undefined): string {
  if (!e164 || !isValidE164CaUs(e164)) return e164 || "";
  const d = e164.slice(2); // 10 digits
  return `+1 (${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

import { normalizeToE164 } from "./phone";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export const MAX_NICKNAME = 24;
export const MAX_REAL_NAME = 80;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type RosterProfileValue = {
  membershipId: string;
  nickname: string;
  realName: string | null;
  email: string;
  phoneE164: string | null;
};

export type ParseRosterProfile =
  | { ok: true; value: RosterProfileValue }
  | { ok: false; error: string; status: number };

export {
  CELL_ALREADY_USED,
  EMAIL_ALREADY_USED,
  isCellTakenByOther,
  isEmailTakenByOther,
} from "./contact-taken";

export function nicknameTaken(
  members: { id: string; nickname: string }[],
  targetId: string,
  nickname: string
): boolean {
  const key = nickname.toLowerCase();
  return members.some((m) => m.id !== targetId && m.nickname.toLowerCase() === key);
}

function fail(error: string): ParseRosterProfile {
  return { ok: false, error, status: 400 };
}

export function parseRosterProfile(body: unknown): ParseRosterProfile {
  if (!body || typeof body !== "object") return fail("Invalid JSON");
  const input = body as Record<string, unknown>;
  const membershipId =
    typeof input.membershipId === "string" ? input.membershipId.trim() : "";
  if (!membershipId) return fail("membershipId required");

  const nickname = typeof input.nickname === "string" ? input.nickname.trim() : "";
  if (!nickname) return fail("Nickname can’t be empty");
  if (nickname.length > MAX_NICKNAME) {
    return fail(`Nickname must be ${MAX_NICKNAME} characters or fewer`);
  }

  const realName = typeof input.realName === "string" ? input.realName.trim() : "";
  if (realName.length > MAX_REAL_NAME) {
    return fail(`Full name must be ${MAX_REAL_NAME} characters or fewer`);
  }

  const email = normalizeEmail(typeof input.email === "string" ? input.email : "");
  if (!email || !EMAIL_RE.test(email)) return fail("Enter a valid email address");

  const phoneRaw = typeof input.phone === "string" ? input.phone.trim() : "";
  let phoneE164: string | null = null;
  if (phoneRaw) {
    phoneE164 = normalizeToE164(phoneRaw);
    if (!phoneE164) {
      return fail("Enter a valid Canadian or US number, e.g. (416) 951-4262 or +1…");
    }
  }

  return {
    ok: true,
    value: { membershipId, nickname, realName: realName || null, email, phoneE164 },
  };
}

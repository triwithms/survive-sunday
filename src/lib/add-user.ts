import { normalizeToE164 } from "./phone";
import { MAX_NICKNAME, MAX_REAL_NAME } from "./roster-profile";
import { TEMP_PASSWORD_MAX, TEMP_PASSWORD_MIN } from "./check-set-member-password";
import { demoEmailLocal } from "./live-roster";
import { PENDING_EMAIL_SUFFIX } from "./pool-mode";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type AddUserValue = {
  nickname: string;
  realName: string | null;
  email: string | null;
  phoneE164: string | null;
  password: string | null;
  invite: boolean;
};

export type ParseAddUser =
  | { ok: true; value: AddUserValue }
  | { ok: false; error: string; status: number };

function fail(error: string): ParseAddUser {
  return { ok: false, error, status: 400 };
}

export function deriveAddUserNickname(input: {
  nickname: string;
  realName: string;
  email: string;
}): string {
  if (input.nickname) return input.nickname;
  const fromName = input.realName.split(/\s+/)[0] ?? "";
  if (fromName) return fromName.slice(0, MAX_NICKNAME);
  const local = input.email.split("@")[0] ?? "";
  const fromEmail = demoEmailLocal(local).replace(/-/g, " ");
  if (fromEmail) {
    return fromEmail.replace(/\b\w/g, (c) => c.toUpperCase()).slice(0, MAX_NICKNAME);
  }
  return "Friend";
}

export function placeholderEmailFor(nickname: string, tag: string): string {
  const local = demoEmailLocal(nickname) || "friend";
  return `${local}-${tag}${PENDING_EMAIL_SUFFIX}`;
}

export function parseAddUser(body: unknown): ParseAddUser {
  if (!body || typeof body !== "object") return fail("Invalid JSON");
  const input = body as Record<string, unknown>;
  const nickname = typeof input.nickname === "string" ? input.nickname.trim() : "";
  const realName = typeof input.realName === "string" ? input.realName.trim() : "";
  const emailRaw = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const phoneRaw = typeof input.phone === "string" ? input.phone.trim() : "";
  const password = typeof input.password === "string" ? input.password : "";
  const invite = input.invite === true;
  if (!nickname && !realName && !emailRaw && !phoneRaw && !password) {
    return fail("Enter a nickname, name, email, cell, or password.");
  }
  if (nickname.length > MAX_NICKNAME) {
    return fail(`Nickname must be ${MAX_NICKNAME} characters or fewer`);
  }
  if (realName.length > MAX_REAL_NAME) {
    return fail(`Full name must be ${MAX_REAL_NAME} characters or fewer`);
  }
  const derived = deriveAddUserNickname({ nickname, realName, email: emailRaw });
  if (derived.toLowerCase() === "commissioner") {
    return fail("Don’t name a player Commissioner.");
  }
  if (emailRaw && !EMAIL_RE.test(emailRaw)) return fail("Enter a valid email address");
  let phoneE164: string | null = null;
  if (phoneRaw) {
    phoneE164 = normalizeToE164(phoneRaw);
    if (!phoneE164) {
      return fail("Enter a valid Canadian or US number, e.g. (416) 951-4262 or +1…");
    }
  }
  if (password) {
    if (password.length < TEMP_PASSWORD_MIN || password.length > TEMP_PASSWORD_MAX) {
      return fail(`Password must be ${TEMP_PASSWORD_MIN}–${TEMP_PASSWORD_MAX} characters.`);
    }
    if (!password.trim()) return fail("Password cannot be only spaces.");
  }
  return {
    ok: true,
    value: {
      nickname: derived,
      realName: realName || null,
      email: emailRaw || null,
      phoneE164,
      password: password || null,
      invite,
    },
  };
}

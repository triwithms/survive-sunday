import { randomInt } from "crypto";
import { prisma } from "./db";
import { nicknameTaken } from "./roster-profile";
import type { AddUserValue } from "./add-user";
import { joinUrl, PUBLIC_APP_ORIGIN } from "./invite-link";
import { isDemoEmail } from "./pool-mode";
import { isSeatClaimed } from "./claim-seat";

export type AdminCtx = { user: { id: string }; membership: { poolId: string } };
export type CreatedUser = {
  id: string;
  nickname: string;
  realName: string | null;
  email: string | null;
  claimed: boolean;
  password: string | null;
  inviteUrl: string | null;
};
export type AddUserResult =
  | { ok: true; membership: CreatedUser }
  | { ok: false; error: string; status: number };

export function appOrigin(): string {
  const env = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (env && /^https?:\/\//i.test(env)) return env.replace(/\/$/, "");
  return PUBLIC_APP_ORIGIN;
}

export function randomTempPassword(): string {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  return `Sunday-${randomInt(1000, 10000)}${letters[randomInt(0, letters.length)]}${letters[randomInt(0, letters.length)]}`;
}

export async function uniqueAddUserNick(poolId: string, desired: string) {
  const pool = await prisma.membership.findMany({
    where: { poolId },
    select: { id: true, nickname: true },
  });
  if (!nicknameTaken(pool, "new", desired)) return desired;
  for (let i = 2; i < 50; i++) {
    const next = `${desired.slice(0, 21)} ${i}`.slice(0, 24);
    if (!nicknameTaken(pool, "new", next)) return next;
  }
  return `${desired.slice(0, 19)} ${Date.now().toString(36).slice(-4)}`.slice(0, 24);
}

export function resolveAddUserEmail(value: AddUserValue): string | null {
  return value.email;
}

export function resolveAddUserPassword(value: AddUserValue, email: string | null): string | null {
  if (value.password) return value.password;
  if (value.invite && !isDemoEmail(email)) return randomTempPassword();
  return null;
}

export function createdUserRow(
  membershipId: string,
  nickname: string,
  value: AddUserValue,
  email: string | null,
  password: string | null,
  inviteUrl: string | null
): CreatedUser {
  return {
    id: membershipId,
    nickname,
    realName: value.realName,
    email,
    claimed: isSeatClaimed(email),
    password,
    inviteUrl,
  };
}

export { joinUrl };

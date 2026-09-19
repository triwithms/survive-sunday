import { prisma } from "./db";
import {
  CELL_ALREADY_USED,
  EMAIL_ALREADY_USED,
  isCellTakenByOther,
  isEmailTakenByOther,
} from "./contact-taken";

export async function findUserIdByEmail(email: string) {
  return prisma.user.findUnique({ where: { email }, select: { id: true } });
}

export async function findUserIdByPhone(phoneE164: string) {
  return prisma.user.findFirst({
    where: { phoneE164 },
    select: { id: true },
  });
}

export async function emailHasPlayerSeat(poolId: string, email: string) {
  const existing = await findUserIdByEmail(email);
  if (!existing) return { existing: null as { id: string } | null, taken: false };
  const seats = await prisma.membership.findMany({
    where: { poolId, userId: existing.id },
    select: { role: true },
  });
  return { existing, taken: seats.some((s) => s.role !== "admin") };
}

export async function rosterContactClash(
  user: { id: string; email: string | null; phoneE164: string | null },
  next: { email: string | null; phoneE164: string | null }
): Promise<{ error: string; status: number } | null> {
  if (next.email) {
    const byEmail = await findUserIdByEmail(next.email);
    if (isEmailTakenByOther(user.id, user.email, next.email, byEmail)) {
      return { error: EMAIL_ALREADY_USED, status: 409 };
    }
  }
  if (!next.phoneE164) return null;
  const byPhone = await findUserIdByPhone(next.phoneE164);
  if (isCellTakenByOther(user.id, user.phoneE164, next.phoneE164, byPhone)) {
    return { error: CELL_ALREADY_USED, status: 409 };
  }
  return null;
}

export async function addUserContactClash(
  poolId: string,
  email: string | null,
  phoneE164: string | null
) {
  const found = email
    ? await emailHasPlayerSeat(poolId, email)
    : { existing: null as { id: string } | null, taken: false };
  if (found.taken) {
    return { ok: false as const, error: EMAIL_ALREADY_USED, status: 409 };
  }
  if (phoneE164) {
    const byPhone = await findUserIdByPhone(phoneE164);
    if (isCellTakenByOther(found.existing?.id ?? "", null, phoneE164, byPhone)) {
      return { ok: false as const, error: CELL_ALREADY_USED, status: 409 };
    }
  }
  return { ok: true as const, existing: found.existing };
}

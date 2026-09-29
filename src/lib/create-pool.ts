import "server-only";
import { randomInt } from "crypto";
import { prisma } from "./db";
import { INVITE_CODE, SEASON } from "./constants";
import { isWeekLocked } from "./grading";
import { nextPlayingWeek } from "./pool-rules";
import { POOL_ROLES } from "./roles";
import { deriveAddUserNickname } from "./add-user";
import { MAX_NICKNAME } from "./roster-profile";
import { parseMulliganChoice, parseNewPoolName } from "./create-pool-input";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ2345679";

export function randomPoolInviteCode(): string {
  let out = "";
  for (let i = 0; i < 8; i += 1) {
    out += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  }
  return out;
}

export type CreatePoolResult =
  | { ok: true; poolId: string; name: string }
  | { ok: false; error: string };

function organizerNickname(args: {
  name: string | null;
  email: string | null;
  seats: Array<{ role: string; nickname: string; realName: string | null }>;
}): { nickname: string; realName: string | null } {
  const player = args.seats.find((seat) => seat.role !== "admin" && seat.nickname.trim());
  const any = args.seats.find((seat) => seat.nickname.trim());
  const source = player ?? any;
  const nickname = (
    source?.nickname ||
    deriveAddUserNickname({
      nickname: "",
      realName: args.name ?? "",
      email: args.email ?? "",
    })
  ).slice(0, MAX_NICKNAME);
  return {
    nickname: nickname || "Organizer",
    realName: source?.realName ?? args.name,
  };
}

/**
 * New pool for the signed-in user. Inserts only. Does not update the
 * live pool's memberships, picks, weeks, or games. NFL games stay on the
 * slate pool (SUNDAY26 when it exists).
 */
export async function createOrganizerPool(args: {
  userId: string;
  name: unknown;
  mulligan: unknown;
}): Promise<CreatePoolResult> {
  const name = parseNewPoolName(args.name);
  if (!name) return { ok: false, error: "Name the pool (2–48 characters)." };
  const mulligan = parseMulliganChoice(args.mulligan);
  if (mulligan === undefined) {
    return { ok: false, error: "Choose a mulligan setting." };
  }

  const user = await prisma.user.findUnique({
    where: { id: args.userId },
    select: { id: true, name: true, email: true },
  });
  if (!user) return { ok: false, error: "Sign in first." };

  const seats = await prisma.membership.findMany({
    where: { userId: user.id },
    select: { role: true, nickname: true, realName: true },
    orderBy: { createdAt: "asc" },
  });
  const profile = organizerNickname({
    name: user.name,
    email: user.email,
    seats,
  });

  const slate =
    (await prisma.pool.findUnique({
      where: { inviteCode: INVITE_CODE },
      include: { weeks: { orderBy: { number: "asc" } } },
    })) ??
    (await prisma.pool.findFirst({
      where: { slatePoolId: null, weeks: { some: { games: { some: {} } } } },
      orderBy: { createdAt: "asc" },
      include: { weeks: { orderBy: { number: "asc" } } },
    }));
  if (!slate || slate.weeks.length === 0) {
    return {
      ok: false,
      error: "The shared NFL schedule is not loaded yet.",
    };
  }

  const currentWeekRow =
    slate.weeks.find((week) => week.number === slate.currentWeek) ??
    slate.weeks[0];
  const playingFromWeek = nextPlayingWeek({
    currentWeek: slate.currentWeek >= 1 ? slate.currentWeek : currentWeekRow.number,
    weekLocked: currentWeekRow ? isWeekLocked(currentWeekRow) : false,
  });

  let inviteCode = "";
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const candidate = randomPoolInviteCode();
    const taken = await prisma.pool.findUnique({
      where: { inviteCode: candidate },
      select: { id: true },
    });
    if (!taken && candidate !== INVITE_CODE) {
      inviteCode = candidate;
      break;
    }
  }
  if (!inviteCode) {
    return { ok: false, error: "Could not start the pool. Try again." };
  }

  const pool = await prisma.$transaction(async (tx) => {
    const created = await tx.pool.create({
      data: {
        name,
        season: slate.season || SEASON,
        inviteCode,
        currentWeek: slate.currentWeek,
        mode: "live",
        singleEliminationFromWeek: mulligan,
        slatePoolId: slate.id,
      },
    });
    await tx.week.createMany({
      data: slate.weeks.map((week) => ({
        poolId: created.id,
        number: week.number,
        label: week.label,
        lockAt: week.lockAt,
        status: "open",
      })),
    });
    await tx.membership.create({
      data: {
        poolId: created.id,
        userId: user.id,
        nickname: profile.nickname,
        realName: profile.realName,
        role: "member",
        isAdmin: true,
        isParticipant: true,
        playingFromWeek,
      },
    });
    await tx.poolAccessRole.createMany({
      data: [
        { poolId: created.id, userId: user.id, role: POOL_ROLES.player },
        {
          poolId: created.id,
          userId: user.id,
          role: POOL_ROLES.administrator,
        },
      ],
      skipDuplicates: true,
    });
    await tx.auditLog.create({
      data: {
        poolId: created.id,
        actorId: user.id,
        action: "pool_created",
        targetType: "pool",
        targetId: created.id,
        details: JSON.stringify({
          name,
          slatePoolId: slate.id,
          mulligan,
        }),
      },
    });
    return created;
  });

  return { ok: true, poolId: pool.id, name: pool.name };
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { isWeekLocked } from "@/lib/grading";
import { nextPlayingWeek, nicknamesMatch } from "@/lib/pool-rules";
import { isPlayerSeat, POOL_ROLES } from "@/lib/roles";
import { grantPoolRole, revokePoolRole } from "@/lib/roles-db";
import { effectiveCurrentWeek } from "@/lib/pool-mode";

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const membershipId =
    typeof body.membershipId === "string" ? body.membershipId.trim() : "";
  const confirmNickname =
    typeof body.confirmNickname === "string"
      ? body.confirmNickname.trim()
      : "";

  if (!membershipId) {
    return NextResponse.json(
      { error: "Choose someone who is already in the pool." },
      { status: 400 }
    );
  }
  if (!confirmNickname) {
    return NextResponse.json(
      { error: "Type their nickname to confirm." },
      { status: 400 }
    );
  }
  if (membershipId === admin.membership.id) {
    return NextResponse.json(
      { error: "You already run this pool." },
      { status: 400 }
    );
  }

  const poolId = admin.membership.poolId;
  const target = await prisma.membership.findFirst({
    where: { id: membershipId, poolId },
  });
  if (!target) {
    return NextResponse.json(
      { error: "That person is not in this pool." },
      { status: 404 }
    );
  }
  if (!isPlayerSeat(target)) {
    return NextResponse.json(
      { error: "Choose someone who is already a player in the pool." },
      { status: 400 }
    );
  }
  if (target.userId === admin.user.id) {
    return NextResponse.json(
      { error: "You already run this pool." },
      { status: 400 }
    );
  }
  if (!nicknamesMatch(target.nickname, confirmNickname)) {
    return NextResponse.json(
      { error: "Nickname does not match. Type it again to confirm." },
      { status: 400 }
    );
  }

  const currentWeek = effectiveCurrentWeek(
    admin.membership.pool.mode,
    admin.membership.pool.currentWeek
  );
  const week = await prisma.week.findUnique({
    where: {
      poolId_number: {
        poolId,
        number: currentWeek,
      },
    },
  });
  const weekLocked = week ? isWeekLocked(week) : true;

  const outgoingSeats = await prisma.membership.findMany({
    where: { poolId, userId: admin.user.id },
  });
  const outgoingPlayerSeat = outgoingSeats.find((m) => isPlayerSeat(m));
  const outgoingSpectatorSeats = outgoingSeats.filter((m) => m.role === "admin");
  const playingFromWeek = outgoingPlayerSeat
    ? outgoingPlayerSeat.playingFromWeek
    : nextPlayingWeek({ currentWeek, weekLocked });

  await grantPoolRole(prisma, {
    poolId,
    userId: target.userId,
    role: POOL_ROLES.administrator,
  });
  await grantPoolRole(prisma, {
    poolId,
    userId: target.userId,
    role: POOL_ROLES.player,
  });

  if (outgoingSpectatorSeats.length > 0) {
    if (outgoingPlayerSeat) {
      for (const seat of outgoingSpectatorSeats) {
        await prisma.membership.update({
          where: { id: seat.id },
          data: {
            role: "member",
            isAdmin: false,
            isParticipant: false,
          },
        });
      }
    } else {
      const [spectator, ...extras] = outgoingSpectatorSeats;
      await prisma.membership.update({
        where: { id: spectator.id },
        data: {
          role: "member",
          isAdmin: false,
          isParticipant: true,
          playingFromWeek,
        },
      });
      await grantPoolRole(prisma, {
        poolId,
        userId: admin.user.id,
        role: POOL_ROLES.player,
      });
      for (const seat of extras) {
        await prisma.membership.update({
          where: { id: seat.id },
          data: {
            role: "member",
            isAdmin: false,
            isParticipant: false,
          },
        });
      }
    }
  }

  await revokePoolRole(prisma, {
    poolId,
    userId: admin.user.id,
    role: POOL_ROLES.administrator,
  });

  await prisma.auditLog.create({
    data: {
      poolId,
      actorId: admin.user.id,
      action: "transfer_commissioner",
      targetType: "membership",
      targetId: target.id,
      details: JSON.stringify({
        fromNickname: admin.membership.nickname,
        fromMembershipId: admin.membership.id,
        toNickname: target.nickname,
        toMembershipId: target.id,
        previousStaysAsMember: true,
        newCommissionerStaysOnBoard: true,
        outgoingPlayingFromWeek: playingFromWeek,
      }),
    },
  });

  return NextResponse.json({
    ok: true,
    transferredTo: target.nickname,
    youAreNowAPlayer: true,
    playingFromWeek,
  });
}

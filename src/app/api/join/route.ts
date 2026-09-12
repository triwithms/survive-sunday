import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { INVITE_CODE } from "@/lib/constants";

export async function POST(req: Request) {
  const body = await req.json();
  const {
    inviteCode,
    email,
    password,
    nickname,
    realName,
  } = body as {
    inviteCode: string;
    email: string;
    password: string;
    nickname: string;
    realName?: string;
  };

  if (!inviteCode || !email || !password || !nickname) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  if (inviteCode.toUpperCase() !== INVITE_CODE) {
    return NextResponse.json({ error: "Invalid invite code" }, { status: 400 });
  }

  const pool = await prisma.pool.findUnique({ where: { inviteCode: INVITE_CODE } });
  if (!pool) {
    return NextResponse.json({ error: "Pool not found — run seed" }, { status: 404 });
  }

  const existingNick = await prisma.membership.findUnique({
    where: { poolId_nickname: { poolId: pool.id, nickname } },
  });
  if (existingNick) {
    return NextResponse.json({ error: "Nickname already taken in this pool" }, { status: 409 });
  }

  let user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    const existing = await prisma.membership.findUnique({
      where: { poolId_userId: { poolId: pool.id, userId: user.id } },
    });
    if (existing) {
      return NextResponse.json({ error: "Already in this pool" }, { status: 409 });
    }
  } else {
    user = await prisma.user.create({
      data: {
        email,
        name: realName || nickname,
        passwordHash: await bcrypt.hash(password, 10),
      },
    });
  }

  const membership = await prisma.membership.create({
    data: {
      poolId: pool.id,
      userId: user.id,
      nickname,
      realName: realName || null,
      role: "member",
    },
  });

  return NextResponse.json({ ok: true, membershipId: membership.id, email });
}

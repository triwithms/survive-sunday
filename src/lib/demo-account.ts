import bcrypt from "bcryptjs";
import { prisma } from "./db";
import { INVITE_CODE } from "./constants";

const DEMO_PROFILES: Record<
  string,
  { nickname: string; realName: string; role: "admin" | "member" }
> = {
  "gams@survivesunday.demo": {
    nickname: "Gams",
    realName: "Robert Gama",
    role: "member",
  },
  "admin@survivesunday.demo": {
    nickname: "Commissioner",
    realName: "Robert Gama",
    role: "admin",
  },
  "black-cobra@survivesunday.demo": {
    nickname: "Black Cobra",
    realName: "Justin John",
    role: "member",
  },
  "cannoli-stuffer@survivesunday.demo": {
    nickname: "Cannoli Stuffer",
    realName: "Michael Frigo",
    role: "member",
  },
  "colin@survivesunday.demo": {
    nickname: "Colin",
    realName: "Colin Malone",
    role: "member",
  },
  "daddy-chill@survivesunday.demo": {
    nickname: "Daddy Chill",
    realName: "Joachim Kuzel",
    role: "member",
  },
  "deep-and-delicious@survivesunday.demo": {
    nickname: "Deep and Delicious",
    realName: "Kent Richmond",
    role: "member",
  },
  "gdogss@survivesunday.demo": {
    nickname: "Gdogss",
    realName: "Tony Gyuro",
    role: "member",
  },
  "jimmyc@survivesunday.demo": {
    nickname: "JimmyC",
    realName: "Jim Coulson",
    role: "member",
  },
  "long-snapper@survivesunday.demo": {
    nickname: "Long Snapper",
    realName: "J S",
    role: "member",
  },
  "steve@survivesunday.demo": {
    nickname: "Steve",
    realName: "Steve",
    role: "member",
  },
};

function profileFor(email: string) {
  const key = email.trim().toLowerCase();
  if (DEMO_PROFILES[key]) return DEMO_PROFILES[key];
  const local = key.split("@")[0] || "player";
  const nickname = local
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  return { nickname: nickname || local, realName: nickname || local, role: "member" as const };
}

/**
 * Make sure a demo seat can authorize. Seed-if-empty at build usually
 * created these rows; this covers a DB that has the pool but is missing
 * the user (or a user with no password hash).
 */
export async function ensureDemoAccount(email: string, password: string): Promise<void> {
  const normalized = email.trim().toLowerCase();
  if (!normalized.endsWith("@survivesunday.demo")) return;

  const existing = await prisma.user.findUnique({ where: { email: normalized } });
  if (existing?.passwordHash) return;

  const passwordHash = await bcrypt.hash(password, 10);
  const profile = profileFor(normalized);

  const user = existing
    ? await prisma.user.update({
        where: { id: existing.id },
        data: { passwordHash, name: existing.name ?? profile.realName },
      })
    : await prisma.user.create({
        data: {
          email: normalized,
          name: profile.realName,
          passwordHash,
        },
      });

  const pool = await prisma.pool.findUnique({ where: { inviteCode: INVITE_CODE } });
  if (!pool) return;

  const already = await prisma.membership.findUnique({
    where: { poolId_userId: { poolId: pool.id, userId: user.id } },
  });
  if (already) return;

  let nickname = profile.nickname;
  const nickTaken = await prisma.membership.findUnique({
    where: { poolId_nickname: { poolId: pool.id, nickname } },
  });
  if (nickTaken) nickname = `${nickname} ${user.id.slice(-4)}`;

  await prisma.membership.create({
    data: {
      poolId: pool.id,
      userId: user.id,
      nickname,
      realName: profile.realName,
      role: profile.role,
    },
  });
}

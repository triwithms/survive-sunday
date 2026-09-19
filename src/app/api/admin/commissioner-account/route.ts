import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { isDemoEmail } from "@/lib/pool-mode";

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Enter a real email address" }, { status: 400 });
  }
  if (isDemoEmail(email)) {
    return NextResponse.json(
      { error: "Use your own email — not a practice address" },
      { status: 400 }
    );
  }
  if (password.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters" },
      { status: 400 }
    );
  }

  const taken = await prisma.user.findUnique({ where: { email } });
  if (taken && taken.id !== admin.user.id) {
    return NextResponse.json(
      {
        error:
          "That email already has an account. Sign in with it, or pick a different email.",
      },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const previousEmail = admin.user.email;

  await prisma.user.update({
    where: { id: admin.user.id },
    data: {
      email,
      passwordHash,
      name: admin.user.name || admin.membership.realName || email,
    },
  });

  await prisma.auditLog.create({
    data: {
      poolId: admin.membership.poolId,
      actorId: admin.user.id,
      action: "commissioner_account_set",
      targetType: "user",
      targetId: admin.user.id,
      details: JSON.stringify({
        from: previousEmail,
        to: email,
        note: "Administrator replaced practice login with a real email",
      }),
    },
  });

  return NextResponse.json({
    ok: true,
    email,
    mustSignInAgain: true,
  });
}

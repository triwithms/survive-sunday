import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getMembershipForUser } from "@/lib/session";
import {
  NOTIFICATION_CATALOG,
  NOTIFICATION_DEFAULTS,
  mergeNotificationPrefs,
  parsePrefPatch,
  prefsToFields,
} from "@/lib/notification-prefs";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const membership = await getMembershipForUser(session.user.id);
  if (!membership) {
    return NextResponse.json({ error: "Not in a pool" }, { status: 403 });
  }

  const row = await prisma.notificationPreference.findUnique({
    where: { membershipId: membership.id },
  });
  const prefs = mergeNotificationPrefs(row);

  return NextResponse.json({
    ok: true,
    membershipId: membership.id,
    prefs: prefsToFields(prefs),
    defaults: prefsToFields({ ...NOTIFICATION_DEFAULTS }),
    catalog: NOTIFICATION_CATALOG,
  });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const membership = await getMembershipForUser(session.user.id);
  if (!membership) {
    return NextResponse.json({ error: "Not in a pool" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = parsePrefPatch(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const row = await prisma.notificationPreference.upsert({
    where: { membershipId: membership.id },
    create: {
      userId: membership.userId,
      membershipId: membership.id,
      ...parsed.patch,
    },
    update: parsed.patch,
  });

  return NextResponse.json({
    ok: true,
    membershipId: membership.id,
    prefs: prefsToFields(mergeNotificationPrefs(row)),
  });
}

export async function POST(req: Request) {
  return PATCH(req);
}

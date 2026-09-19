import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import {
  gradeWeekPicks,
  gradePickFromScore,
  applyLossToMembership,
  applyWinToMembership,
  isWeekLocked,
  ensureWeekLockedEffects,
  rebuildUsedTeams,
  undoPickMembershipEffect,
  parseUsedTeams,
  MISSED_TEAM,
} from "@/lib/grading";

type ImportRow = {
  nickname?: string;
  email?: string;
  teamAbbr: string;
};

type PreviewRow = {
  input: string;
  nickname: string;
  email?: string;
  teamAbbr: string;
  memberId?: string;
  ok: boolean;
  error?: string;
  matchBy?: "nickname" | "email";
  existingTeam?: string | null;
  existingResult?: string | null;
};

/**
 * Administrator import of prior/outside picks for a week (Wave 1).
 * Body: { weekNumber, rows|csv, overrideReuse?, dryRun?: boolean }
 * Matching: exact nickname (case-insensitive) first, then email.
 */
export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const weekNumber = Number(body.weekNumber ?? 1);
  if (body.enterPick === true) {
    const { assertEnterPickWeek } = await import("@/lib/enter-pick-week-db");
    const nick =
      Array.isArray(body.rows) && body.rows[0]?.nickname
        ? String(body.rows[0].nickname)
        : "";
    const check = await assertEnterPickWeek({
      poolId: admin.membership.poolId,
      mode: admin.membership.pool.mode,
      storedCurrentWeek: admin.membership.pool.currentWeek,
      weekNumber,
      nickname: nick,
    });
    if (!check.ok) {
      return NextResponse.json({ error: check.error }, { status: 400 });
    }
  }
  const overrideReuse = Boolean(body.overrideReuse);
  const dryRun = Boolean(body.dryRun);
  let rows: ImportRow[] = body.rows || [];

  if (body.csv && typeof body.csv === "string") {
    rows = parseCsv(body.csv);
  }

  if (!rows.length) {
    return NextResponse.json({ error: "No rows to import" }, { status: 400 });
  }

  const week = await prisma.week.findUnique({
    where: {
      poolId_number: {
        poolId: admin.membership.poolId,
        number: weekNumber,
      },
    },
    include: { games: true },
  });
  if (!week) {
    return NextResponse.json({ error: "Week not found" }, { status: 404 });
  }

  const members = await prisma.membership.findMany({
    where: { poolId: admin.membership.poolId },
    include: { user: true, picks: true },
  });

  const preview: PreviewRow[] = [];
  const resolved: {
    member: (typeof members)[0];
    teamAbbr: string;
    game: (typeof week.games)[0];
    matchBy: "nickname" | "email";
    input: string;
  }[] = [];

  for (const row of rows) {
    const teamAbbr = (row.teamAbbr || "").toUpperCase().trim();
    const nick = (row.nickname || "").trim();
    const email = (row.email || "").trim().toLowerCase();
    const input = nick || email || teamAbbr;

    if (!teamAbbr) {
      preview.push({
        input,
        nickname: nick || email,
        teamAbbr,
        ok: false,
        error: "Missing team",
      });
      continue;
    }

    // Prefer exact nickname match first, then email
    let member = nick
      ? members.find((m) => m.nickname.toLowerCase() === nick.toLowerCase())
      : undefined;
    let matchBy: "nickname" | "email" | undefined = member ? "nickname" : undefined;
    if (!member && email) {
      member = members.find((m) => m.user.email.toLowerCase() === email);
      if (member) matchBy = "email";
    }
    // If both provided and nickname missed, email already tried; if only nickname in email field handled by parse

    if (!member) {
      preview.push({
        input,
        nickname: nick || email,
        email: email || undefined,
        teamAbbr,
        ok: false,
        error: "Member not found (nickname or email)",
      });
      continue;
    }

    const team = await prisma.team.findUnique({ where: { abbr: teamAbbr } });
    if (!team) {
      preview.push({
        input,
        nickname: member.nickname,
        teamAbbr,
        memberId: member.id,
        ok: false,
        error: "Unknown team abbreviation",
        matchBy,
      });
      continue;
    }

    const game = week.games.find(
      (g) => g.awayAbbr === teamAbbr || g.homeAbbr === teamAbbr
    );
    if (!game) {
      preview.push({
        input,
        nickname: member.nickname,
        teamAbbr,
        memberId: member.id,
        ok: false,
        error: "Team not playing this week (bye?)",
        matchBy,
      });
      continue;
    }

    const existingPick = member.picks.find((p) => p.weekId === week.id);
    const seededUsed = parseUsedTeams(member.usedTeamsJson);
    const usedBefore =
      member.picks.some(
        (p) =>
          p.weekId !== week.id &&
          p.source !== "missed" &&
          p.teamAbbr === teamAbbr
      ) ||
      (seededUsed.includes(teamAbbr) &&
        existingPick?.teamAbbr !== teamAbbr &&
        teamAbbr !== MISSED_TEAM);

    if (usedBefore && !overrideReuse) {
      preview.push({
        input,
        nickname: member.nickname,
        teamAbbr,
        memberId: member.id,
        ok: false,
        error: "Team already used — set overrideReuse to force (audit logged)",
        matchBy,
        existingTeam: existingPick?.teamAbbr ?? null,
        existingResult: existingPick?.result ?? null,
      });
      continue;
    }

    preview.push({
      input,
      nickname: member.nickname,
      email: member.user.email,
      teamAbbr,
      memberId: member.id,
      ok: true,
      matchBy,
      existingTeam: existingPick?.teamAbbr ?? null,
      existingResult: existingPick?.result ?? null,
    });

    resolved.push({ member, teamAbbr, game, matchBy: matchBy!, input });
  }

  if (dryRun) {
    return NextResponse.json({
      ok: true,
      dryRun: true,
      weekNumber,
      locked: isWeekLocked(week),
      matchOrder: "nickname then email",
      preview,
      wouldImport: preview.filter((r) => r.ok).length,
      wouldFail: preview.filter((r) => !r.ok).length,
    });
  }

  const results: {
    nickname: string;
    teamAbbr: string;
    ok: boolean;
    error?: string;
    pickId?: string;
    graded?: string;
    skippedMembershipUpdate?: boolean;
  }[] = [];

  const newlyOut: Array<{
    membershipId: string;
    userId: string;
    nickname: string;
  }> = [];

  for (const item of resolved) {
    const { member, teamAbbr, game, matchBy } = item;
    const existingPick = member.picks.find((p) => p.weekId === week.id);
    const seededUsed = parseUsedTeams(member.usedTeamsJson);

    const usedBefore =
      member.picks.some(
        (p) =>
          p.weekId !== week.id &&
          p.source !== "missed" &&
          p.teamAbbr === teamAbbr
      ) ||
      (seededUsed.includes(teamAbbr) && existingPick?.teamAbbr !== teamAbbr);

    if (usedBefore && !overrideReuse) {
      results.push({
        nickname: member.nickname,
        teamAbbr,
        ok: false,
        error: "Team already used — set overrideReuse to force (audit logged)",
      });
      continue;
    }

    const alreadyGraded =
      !!existingPick?.result &&
      existingPick.result !== "pending" &&
      existingPick.source !== "missed";
    const sameTeam = existingPick?.teamAbbr === teamAbbr;
    const immediate = gradePickFromScore(teamAbbr, game);

    // Same team already graded → do not reset result or re-burn mulligan / weeksSurvived
    if (existingPick && sameTeam && alreadyGraded) {
      const pick = await prisma.pick.update({
        where: { id: existingPick.id },
        data: {
          gameId: game.id,
          source: "imported",
          submittedAt: new Date(),
          // keep result + gradedAt
        },
      });

      member.picks = [
        ...member.picks.filter((p) => p.weekId !== week.id),
        pick,
      ];
      await rebuildUsedTeams(member.id);
      member.usedTeamsJson = (
        await prisma.membership.findUniqueOrThrow({ where: { id: member.id } })
      ).usedTeamsJson;

      await prisma.auditLog.create({
        data: {
          poolId: admin.membership.poolId,
          actorId: admin.user.id,
          action: "import_pick",
          targetType: "pick",
          targetId: pick.id,
          details: JSON.stringify({
            nickname: member.nickname,
            teamAbbr,
            weekNumber,
            source: "imported",
            matchBy,
            skippedMembershipUpdate: true,
            existingResult: existingPick.result,
            weekLocked: isWeekLocked(week),
          }),
        },
      });

      results.push({
        nickname: member.nickname,
        teamAbbr,
        ok: true,
        pickId: pick.id,
        graded: existingPick.result ?? undefined,
        skippedMembershipUpdate: true,
      });
      continue;
    }

    const freedTeam =
      existingPick &&
      existingPick.teamAbbr !== teamAbbr &&
      existingPick.source !== "missed"
        ? existingPick.teamAbbr
        : null;

    const wasGradedDifferentTeam = alreadyGraded && !sameTeam;

    const pick = await prisma.pick.upsert({
      where: {
        membershipId_weekId: {
          membershipId: member.id,
          weekId: week.id,
        },
      },
      create: {
        membershipId: member.id,
        weekId: week.id,
        teamAbbr,
        gameId: game.id,
        source: "imported",
        result: "pending",
      },
      update: {
        teamAbbr,
        gameId: game.id,
        source: "imported",
        submittedAt: new Date(),
        result: "pending",
        gradedAt: null,
      },
    });

    member.picks = [
      ...member.picks.filter((p) => p.weekId !== week.id),
      pick,
    ];

    // If replacing a previously graded pick, undo its membership effect once
    if (wasGradedDifferentTeam && existingPick) {
      await undoPickMembershipEffect(member.id, existingPick.result);
    }

    let gradedResult: string | undefined;

    if (immediate !== "pending") {
      await prisma.pick.update({
        where: { id: pick.id },
        data: { result: immediate, gradedAt: new Date() },
      });
      pick.result = immediate;

      if (immediate === "loss" || immediate === "push") {
        const after = await applyLossToMembership(member.id, weekNumber);
        if (after.newlyEliminated) {
          newlyOut.push({
            membershipId: member.id,
            userId: member.userId,
            nickname: member.nickname,
          });
        }
      } else if (immediate === "win") {
        await applyWinToMembership(member.id);
      }
      gradedResult = immediate;
    }

    await rebuildUsedTeams(member.id, { freedTeam });
    member.usedTeamsJson = (
      await prisma.membership.findUniqueOrThrow({ where: { id: member.id } })
    ).usedTeamsJson;

    await prisma.auditLog.create({
      data: {
        poolId: admin.membership.poolId,
        actorId: admin.user.id,
        action: "import_pick",
        targetType: "pick",
        targetId: pick.id,
        details: JSON.stringify({
          nickname: member.nickname,
          teamAbbr,
          weekNumber,
          source: "imported",
          matchBy,
          overrideReuse: usedBefore && overrideReuse,
          graded: gradedResult ?? null,
          weekLocked: isWeekLocked(week),
          freedTeam,
        }),
      },
    });

    results.push({
      nickname: member.nickname,
      teamAbbr,
      ok: true,
      pickId: pick.id,
      graded: gradedResult,
    });
  }

  // Also include preview failures in results for UI
  for (const p of preview.filter((r) => !r.ok)) {
    if (!results.some((r) => r.nickname === p.nickname && r.teamAbbr === p.teamAbbr)) {
      results.push({
        nickname: p.nickname,
        teamAbbr: p.teamAbbr,
        ok: false,
        error: p.error,
      });
    }
  }

  await ensureWeekLockedEffects(week.id);
  // Safety: grade remaining finals (only pending — won't re-burn)
  await gradeWeekPicks(week.id);

  if (newlyOut.length > 0) {
    const { scheduleAdminEliminationNotice } = await import(
      "@/lib/elimination-admin-alert"
    );
    scheduleAdminEliminationNotice({
      poolId: admin.membership.poolId,
      weekId: week.id,
      weekNumber,
      eliminated: newlyOut,
    });
  }

  return NextResponse.json({
    ok: true,
    weekNumber,
    locked: isWeekLocked(week),
    imported: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    results,
    preview,
  });
}

function parseCsv(text: string): ImportRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (!lines.length) return [];

  const rows: ImportRow[] = [];
  let start = 0;
  const header = lines[0].toLowerCase();
  const hasHeader =
    header.includes("nickname") ||
    header.includes("email") ||
    header.includes("team");
  if (hasHeader) start = 1;

  for (let i = start; i < lines.length; i++) {
    const parts = lines[i].split(/[,\t]/).map((p) => p.trim().replace(/^"|"$/g, ""));
    if (parts.length < 2) continue;
    if (parts.length >= 3) {
      rows.push({ nickname: parts[0], email: parts[1], teamAbbr: parts[2] });
    } else if (parts[0].includes("@")) {
      rows.push({ email: parts[0], teamAbbr: parts[1] });
    } else {
      rows.push({ nickname: parts[0], teamAbbr: parts[1] });
    }
  }
  return rows;
}

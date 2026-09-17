"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { unusedTeamsForWeek, pickForWeek } from "./enter-pick-options";
import type { EnterPickData, EnterPickSaved } from "./enter-pick-types";
import { importErrorMessage } from "./import-picks-types";

export function useEnterPick(data: EnterPickData) {
  const router = useRouter();
  const [memberId, setMemberId] = useState(data.members[0]?.id ?? "");
  const [weekNumber, setWeekNumber] = useState(data.currentWeek);
  const [teamAbbr, setTeamAbbr] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [saved, setSaved] = useState<EnterPickSaved | null>(null);

  const member = data.members.find((m) => m.id === memberId);
  const week = data.weeks.find((w) => w.number === weekNumber);
  const teams = useMemo(
    () => unusedTeamsForWeek({ weekTeams: week?.teams ?? [], member, weekNumber }),
    [week, member, weekNumber]
  );
  const current = pickForWeek(member, weekNumber);

  useEffect(() => {
    const allowed = new Set(teams.map((t) => t.abbr));
    const next = current && allowed.has(current) ? current : "";
    setTeamAbbr(next);
  }, [memberId, weekNumber, current, teams]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setSaved(null);
    if (!member) {
      setErr("Pick the friend who called.");
      return;
    }
    if (!teamAbbr) {
      setErr("Pick an unused team playing this week.");
      return;
    }
    setBusy(true);
    const res = await fetch("/api/admin/import-picks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        weekNumber,
        rows: [{ nickname: member.nickname, teamAbbr }],
      }),
    });
    const dataJson = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setErr(importErrorMessage(dataJson, "Could not save that pick."));
      return;
    }
    const row = (dataJson.results as { ok?: boolean; error?: string }[] | undefined)?.[0];
    if (row && row.ok === false) {
      setErr(row.error || "Could not save that pick.");
      return;
    }
    setSaved({ nickname: member.nickname, teamAbbr, weekNumber });
    router.refresh();
  }

  return {
    memberId, setMemberId, weekNumber, setWeekNumber, teamAbbr, setTeamAbbr,
    busy, err, saved, setSaved, member, teams, current, save, members: data.members,
    weeks: data.weeks,
  };
}

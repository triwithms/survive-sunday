"use client";

import { useMemo, useState } from "react";
import { weekWrapContent } from "@/lib/week-wrap-copy";
import type {
  WeekWrapBlocks,
  WeekWrapPanelData,
  WeekWrapTone,
} from "@/lib/week-wrap-types";

export function useWeekWrap(data: WeekWrapPanelData) {
  const [weekNumber, setWeekNumber] = useState(data.selectedWeek);
  const [tone, setTone] = useState<WeekWrapTone>(data.tone);
  const [blocks, setBlocks] = useState<WeekWrapBlocks>(data.blocks);
  const [emailOverride, setEmailOverride] = useState(data.emailOverride);
  const [smsOverride, setSmsOverride] = useState(data.smsOverride);
  const [busy, setBusy] = useState<"" | "save" | "send" | "skip">("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [weeks, setWeeks] = useState(data.weeks);
  const week = weeks.find((row) => row.number === weekNumber) ?? weeks[0];

  const preview = useMemo(() => {
    if (!week) return null;
    return weekWrapContent({
      tone,
      blocks,
      facts: {
        weekNumber: week.number,
        players: week.players,
        boardUrl: data.boardUrl,
        board: data.board,
        nfl: data.nfl,
      },
      emailOverride,
      smsOverride,
    });
  }, [week, tone, blocks, emailOverride, smsOverride, data.boardUrl, data.board, data.nfl]);

  function toggle(key: keyof WeekWrapBlocks) {
    setBlocks((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function run(action: "save" | "send" | "skip") {
    const label = `Week ${weekNumber}`;
    if (action === "send" && !window.confirm(`Send the ${label} wrap now?`)) return;
    if (action === "skip" && !window.confirm(`Skip the automatic ${label} wrap?`)) {
      return;
    }
    setBusy(action);
    setMsg("");
    setErr("");
    try {
      const res = await fetch("/api/admin/week-wrap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          weekNumber,
          tone,
          blocks,
          emailOverride,
          smsOverride,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(typeof body.error === "string" ? body.error : "Could not save");
        return;
      }
      setMsg(typeof body.message === "string" ? body.message : "Saved");
      setWeeks((prev) =>
        prev.map((row) =>
          row.number === weekNumber
            ? {
                ...row,
                skipped:
                  typeof body.skipped === "boolean" ? body.skipped : row.skipped,
                sent: action === "send" ? true : row.sent,
              }
            : row
        )
      );
    } catch {
      setErr("Network error — try again");
    } finally {
      setBusy("");
    }
  }

  return {
    weekNumber, setWeekNumber, tone, setTone, blocks, toggle,
    emailOverride, setEmailOverride, smsOverride, setSmsOverride,
    busy, msg, err, week, weeks, preview, run,
  };
}

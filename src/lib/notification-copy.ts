export type NotifyContent = {
  subject: string;
  text: string;
  htmlBody: string;
  smsBody?: string;
};

export function pickConfirmedCopy(opts: {
  nickname: string;
  weekNumber: number;
  teamAbbr: string;
  changed: boolean;
}): NotifyContent {
  const who = opts.nickname || "you";
  const verb = opts.changed ? "changed" : "saved";
  const subject = opts.changed
    ? `Pick changed — Week ${opts.weekNumber} ${opts.teamAbbr}`
    : `Pick saved — Week ${opts.weekNumber} ${opts.teamAbbr}`;
  const line = `${who}, your Week ${opts.weekNumber} pick is ${opts.teamAbbr} (${verb}).`;
  return {
    subject,
    text: `${line}\n\nYou can still change it until lock (Week 1: until that team’s kickoff if the new game has not started).`,
    htmlBody: `<p style="margin:0 0 12px;">${escapeHtml(line)}</p><p style="color:#9aa5b5;margin:0;">You can still change it until lock (Week 1: until that team’s kickoff if the new game has not started).</p>`,
  };
}

export function resultsCopy(opts: {
  nickname: string;
  weekNumber: number;
  teamAbbr: string;
  result: "win" | "loss" | "push" | "missed";
  status?: string | null;
  mulliganBurned?: boolean;
}): NotifyContent {
  const who = opts.nickname || "you";
  const resultLine =
    opts.result === "win"
      ? `${opts.teamAbbr} won — you’re still in.`
      : opts.result === "missed"
        ? `No pick for Week ${opts.weekNumber} — that counts as a loss.`
        : `${opts.teamAbbr} did not cover the win — that’s a loss.`;
  const extra = opts.mulliganBurned
    ? " Your mulligan is used. You’re still in with one loss."
    : opts.status === "eliminated"
      ? " You’re out for the season — you can still follow the board."
      : "";
  const subject =
    opts.result === "win"
      ? `Week ${opts.weekNumber}: ${opts.teamAbbr} survived`
      : opts.status === "eliminated"
        ? `Week ${opts.weekNumber}: you’re out`
        : opts.mulliganBurned
          ? `Week ${opts.weekNumber}: mulligan used`
          : `Week ${opts.weekNumber}: pick graded`;
  const text = `${who}, ${resultLine}${extra}`;
  return {
    subject,
    text,
    htmlBody: `<p style="margin:0;">${escapeHtml(text)}</p>`,
  };
}

export function missingPickCopy(opts: {
  nickname: string;
  weekNumber: number;
  lockLabel: string;
}): NotifyContent {
  const who = opts.nickname || "you";
  const subject = `Reminder: no Week ${opts.weekNumber} pick yet`;
  const text = `${who}, you don’t have a pick for Week ${opts.weekNumber}. Lock is ${opts.lockLabel}. Open Survive Sunday and pick a team.`;
  return {
    subject,
    text,
    htmlBody: `<p style="margin:0 0 12px;">${escapeHtml(text)}</p><p style="margin:0;"><a href="https://survive-sunday.vercel.app/pick" style="color:#e8c547;">Open Pick</a></p>`,
    smsBody: `Survive Sunday: no Week ${opts.weekNumber} pick yet. Lock ${opts.lockLabel}. Open the app and pick.`,
  };
}

export function announcementCopy(opts: {
  nickname: string;
  message: string;
}): NotifyContent {
  const who = opts.nickname || "friend";
  return {
    subject: "Pool note from your commissioner",
    text: `${who},\n\n${opts.message}`,
    htmlBody: `<p style="margin:0 0 12px;">${escapeHtml(who)},</p><p style="margin:0;white-space:pre-wrap;">${escapeHtml(opts.message)}</p>`,
  };
}

export function scoreUpdateCopy(opts: {
  nickname: string;
  weekNumber: number;
  teamAbbr: string;
  awayAbbr: string;
  homeAbbr: string;
  scoreAway: number | null;
  scoreHome: number | null;
  clockLabel?: string | null;
}): NotifyContent {
  const score =
    opts.scoreAway != null && opts.scoreHome != null
      ? `${opts.awayAbbr} ${opts.scoreAway}–${opts.scoreHome} ${opts.homeAbbr}`
      : `${opts.awayAbbr} @ ${opts.homeAbbr}`;
  const clock = opts.clockLabel ? ` (${opts.clockLabel})` : "";
  const text = `${opts.nickname || "You"}: Week ${opts.weekNumber} ${opts.teamAbbr} — ${score}${clock}.`;
  return {
    subject: `Live: ${score}`,
    text,
    htmlBody: `<p style="margin:0;">${escapeHtml(text)}</p>`,
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Copy + filters for Administrator alerts when someone is eliminated. */

export type EliminatedPlayer = {
  membershipId: string;
  userId: string;
  nickname: string;
};

export function joinCanadianList(items: string[]): string {
  const names = items.map((s) => s.trim()).filter(Boolean);
  if (names.length === 0) return "A player";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

export function newEliminations<
  T extends { beforeStatus: string; afterStatus: string },
>(events: T[]): T[] {
  return events.filter(
    (e) => e.beforeStatus !== "eliminated" && e.afterStatus === "eliminated"
  );
}

export function eliminationEventDedupeKey(weekId: string, membershipId: string) {
  return `admin-notice:${weekId}:${membershipId}`;
}

export function adminBlastDedupeKey(
  weekId: string,
  membershipIds: string[],
  channel: "email" | "sms"
) {
  const ids = [...membershipIds].sort().join(",");
  return `admin-notice:${weekId}:${ids}:${channel}`;
}

export function eliminationAdminCopy(opts: {
  weekNumber: number;
  nicknames: string[];
}) {
  const who = joinCanadianList(opts.nicknames);
  const many = opts.nicknames.length > 1;
  const verb = many ? "are" : "is";
  const trouble = many
    ? "If someone had technical trouble"
    : "If they had technical trouble";
  const subject = many
    ? `Survive Sunday — ${opts.nicknames.length} players are out`
    : `Survive Sunday — ${who} is out`;
  const text = `${who} ${verb} out of the pool for this season (Week ${opts.weekNumber}). ${trouble}, an Administrator can override or fix picks from Admin → System → Enter a friend’s pick.`;
  return {
    subject,
    text,
    htmlBody: `<p style="margin:0 0 12px;">${escapeHtml(text)}</p>`,
    smsBody: `${who} ${verb} out (Week ${opts.weekNumber}). Admins can override/fix picks if there was technical trouble.`,
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

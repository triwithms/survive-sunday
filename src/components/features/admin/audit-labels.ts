const TITLES: Record<string, string> = {
  update_roster: "Updated a roster name",
  update_real_name: "Updated a real name",
  member_temp_password_set: "Set a friend’s password",
  grant_admin: "Made administrator",
  revoke_admin: "Removed administrator",
  transfer_commissioner: "Handed the pool",
  commissioner_account_set: "Saved administrator login",
  pool_rules_mulligan: "Changed pool rules",
  pool_announcement: "Sent a pool note",
  import_pick: "Imported a pick",
  remove_player: "Removed a player",
  reset_pool_season: "Reset the pool",
  force_grade: "Forced grade",
  simulate_scores: "Simulated scores",
  missed_pick_applied: "Applied a missed pick",
  claim_seat: "Friend claimed a seat",
};

export function auditTitle(action: string): string {
  return TITLES[action] ?? action.replaceAll("_", " ");
}

export function auditWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function auditDetail(raw: string | null): string {
  if (!raw) return "";
  try {
    const obj = JSON.parse(raw) as Record<string, unknown>;
    const bits = ["nickname", "summary", "note", "emailMasked"]
      .map((key) => obj[key])
      .filter((v): v is string => typeof v === "string" && v.trim() !== "");
    return bits.join(" · ");
  } catch {
    return raw;
  }
}

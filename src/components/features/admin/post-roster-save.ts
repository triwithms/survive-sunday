export async function postRosterSave(
  membershipId: string,
  nickname: string,
  realName: string
) {
  const res = await fetch("/api/admin/roster", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ membershipId, nickname, realName }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false as const, error: data.error || "Could not save" };
  return { ok: true as const, membership: data.membership as { nickname?: string; realName?: string } };
}

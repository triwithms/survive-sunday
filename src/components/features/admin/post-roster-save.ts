export type RosterSaveBody = {
  membershipId: string;
  nickname: string;
  realName: string;
  email: string;
  phone: string;
};

export async function postRosterSave(body: RosterSaveBody) {
  const res = await fetch("/api/admin/roster", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false as const, error: data.error || "Could not save" };
  }
  return {
    ok: true as const,
    membership: data.membership as {
      nickname?: string;
      realName?: string;
      email?: string;
      phoneE164?: string | null;
    },
  };
}

export async function saveNicknameAndName(input: {
  nickname: string;
  realName?: string;
}): Promise<string | null> {
  const res = await fetch("/api/membership/nickname", {
    method: "PATCH",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) return data.error || "Couldn’t save your name.";
  return null;
}

export async function savePhone(phone: string): Promise<string | null> {
  const res = await fetch("/api/user/phone", {
    method: "PATCH",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone }),
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) return data.error || "Couldn’t save your cell number.";
  return null;
}

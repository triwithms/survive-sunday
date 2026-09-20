export async function postJoin(body: Record<string, unknown>): Promise<{
  ok: boolean;
  error?: string;
}> {
  const res = await fetch("/api/join", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  let data: { error?: string; ok?: boolean } = {};
  try {
    data = await res.json();
  } catch {
    return {
      ok: false,
      error: `Join failed (HTTP ${res.status}). Try again on this same link.`,
    };
  }
  if (!res.ok) {
    return {
      ok: false,
      error: data.error || `Join failed (HTTP ${res.status})`,
    };
  }
  return { ok: true };
}

export function joinRequestBody(args: {
  newPlayer: boolean;
  inviteCode: string;
  email: string;
  password: string;
  nickname: string;
  realName: string;
  membershipId: string;
  tokenParam: string;
}): Record<string, unknown> {
  if (args.newPlayer) {
    return {
      inviteCode: args.inviteCode,
      email: args.email,
      password: args.password,
      nickname: args.nickname,
      realName: args.realName,
    };
  }
  return {
    inviteCode: args.inviteCode,
    email: args.email,
    password: args.password,
    membershipId: args.membershipId,
    ...(args.tokenParam ? { inviteToken: args.tokenParam } : {}),
  };
}

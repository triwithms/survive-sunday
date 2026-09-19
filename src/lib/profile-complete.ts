/** Missing profile fields after Sign in (one-time complete screen). */

export type ProfileField = "nickname" | "fullName" | "phone";

export type ProfileSnapshot = {
  nickname?: string | null;
  realName?: string | null;
  userName?: string | null;
  phoneE164?: string | null;
};

function filled(value: string | null | undefined): boolean {
  return Boolean((value ?? "").trim());
}

export function missingProfileFields(snap: ProfileSnapshot): ProfileField[] {
  const missing: ProfileField[] = [];
  if (!filled(snap.nickname)) missing.push("nickname");
  if (!filled(snap.realName) && !filled(snap.userName)) {
    missing.push("fullName");
  }
  if (!filled(snap.phoneE164)) missing.push("phone");
  return missing;
}

export function profileIsComplete(snap: ProfileSnapshot): boolean {
  return missingProfileFields(snap).length === 0;
}

export function snapshotFromMember(member: {
  nickname: string;
  realName: string | null;
  user: { name?: string | null; phoneE164?: string | null };
}): ProfileSnapshot {
  return {
    nickname: member.nickname,
    realName: member.realName,
    userName: member.user.name,
    phoneE164: member.user.phoneE164,
  };
}

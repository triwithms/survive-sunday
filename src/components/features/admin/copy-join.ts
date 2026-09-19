import { personalInviteUrl, shareOrigin } from "@/lib/invite-link";

export function memberCopyJoinUrl(
  membershipId: string,
  nickname: string,
  rosterNicknames: string[]
): string {
  return personalInviteUrl(
    shareOrigin(),
    { membershipId, nickname },
    rosterNicknames.map((n) => ({ nickname: n }))
  );
}

export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const input = document.createElement("textarea");
    input.value = text;
    input.setAttribute("readonly", "");
    input.style.position = "fixed";
    input.style.left = "-9999px";
    document.body.appendChild(input);
    input.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(input);
    return ok;
  } catch {
    return false;
  }
}

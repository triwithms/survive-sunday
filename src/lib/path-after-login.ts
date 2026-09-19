import { DEFAULT_SIGNED_IN_PATH } from "./app-paths";
import { profileIsComplete, snapshotFromMember } from "./profile-complete";
import { getUserPoolContext } from "./session";

export async function pathAfterLogin(userId: string): Promise<string> {
  const ctx = await getUserPoolContext(userId);
  if (!ctx.membership) return "/join";
  if (profileIsComplete(snapshotFromMember(ctx.membership))) {
    return DEFAULT_SIGNED_IN_PATH;
  }
  return "/welcome";
}

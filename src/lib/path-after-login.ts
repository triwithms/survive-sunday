import { DEFAULT_SIGNED_IN_PATH } from "./app-paths";
import { SIGNED_IN_NO_POOL_PATH } from "./entry-path";
import { profileIsComplete, snapshotFromMember } from "./profile-complete";
import { getUserPoolContext } from "./session";

export async function pathAfterLogin(userId: string): Promise<string> {
  const ctx = await getUserPoolContext(userId);
  // No pool seat stays on Sign in. Never the public invite-code Join screen.
  if (!ctx.membership) return SIGNED_IN_NO_POOL_PATH;
  if (profileIsComplete(snapshotFromMember(ctx.membership))) {
    return DEFAULT_SIGNED_IN_PATH;
  }
  return "/welcome";
}

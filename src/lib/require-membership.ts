import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getMembershipForUser } from "@/lib/session";

export async function requireMembership() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const me = await getMembershipForUser(session.user.id);
  if (!me) redirect("/join");
  return me;
}

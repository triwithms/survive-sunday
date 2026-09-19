import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { pathAfterLogin } from "@/lib/path-after-login";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Cold open is Sign in. Signed-in users go to profile complete or the pool. */
export default async function LandingPage() {
  try {
    const session = await auth();
    if (session?.user?.id) redirect(await pathAfterLogin(session.user.id));
  } catch (error) {
    console.error("[home] session check failed", error);
  }
  redirect("/login");
}

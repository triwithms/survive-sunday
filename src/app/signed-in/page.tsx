import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SignedInHandoff } from "@/components/SignedInHandoff";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Soft landing after demo login. Prefer /pool after sign-in; this page
 *  remains for older 303s and Safari cookie settle. */
export default async function SignedInPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/?error=NoSession");
  }
  return <SignedInHandoff />;
}

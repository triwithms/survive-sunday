import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SignedInHandoff } from "@/components/SignedInHandoff";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Soft landing after demo login so Safari stores the session cookie. */
export default async function SignedInPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/?error=NoSession");
  }
  return <SignedInHandoff />;
}

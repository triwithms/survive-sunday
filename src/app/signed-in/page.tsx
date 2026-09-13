import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SignedInHandoff } from "@/components/SignedInHandoff";
import { loginFailurePath } from "@/lib/login-error";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SignedInSearch = {
  email?: string | string[];
};

/** Soft landing after login. Prefer /pool after sign-in; this page
 *  remains for older 303s and Safari cookie settle. */
export default async function SignedInPage({
  searchParams,
}: {
  searchParams?: Promise<SignedInSearch>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    const params = searchParams ? await searchParams : undefined;
    const email = Array.isArray(params?.email) ? params.email[0] : params?.email;
    redirect(loginFailurePath("NoSession", email));
  }
  return <SignedInHandoff />;
}

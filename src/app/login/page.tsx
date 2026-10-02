import { Suspense } from "react";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/features/login";
import { SeatlessSession } from "@/components/features/login/SeatlessSession";
import { auth } from "@/lib/auth";
import { signedInLoginRedirect } from "@/lib/entry-path";
import { pathAfterLogin } from "@/lib/path-after-login";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function LoginPage() {
  const session = await auth();
  if (session?.user?.id) {
    // No pool seat used to redirect here → /join → here. Stay on Sign in.
    const next = signedInLoginRedirect(
      await pathAfterLogin(session.user.id)
    );
    if (next) redirect(next);
  }

  return (
    <Suspense>
      {session?.user?.id ? (
        <SeatlessSession email={session.user.email ?? ""} />
      ) : null}
      <LoginForm />
    </Suspense>
  );
}

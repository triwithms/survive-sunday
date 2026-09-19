import { Suspense } from "react";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/features/login";
import { auth } from "@/lib/auth";
import { pathAfterLogin } from "@/lib/path-after-login";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function LoginPage() {
  const session = await auth();
  if (session?.user?.id) {
    redirect(await pathAfterLogin(session.user.id));
  }

  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

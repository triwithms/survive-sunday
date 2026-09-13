import { Suspense } from "react";
import { LoginForm } from "@/components/LoginForm";
import { isDemoMode } from "@/lib/pool-mode";
import { getPrimaryPoolMode } from "@/lib/pool-mode-db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function LoginPage() {
  const mode = await getPrimaryPoolMode();
  return (
    <Suspense>
      <LoginForm demoMode={isDemoMode(mode)} />
    </Suspense>
  );
}

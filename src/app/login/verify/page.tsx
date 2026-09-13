import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { TwoFactorForm } from "@/components/TwoFactorForm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function TwoFactorPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (!session.twoFactorPending) redirect("/pool");
  return <TwoFactorForm email={session.user.email} />;
}

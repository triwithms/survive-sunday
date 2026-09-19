import { redirect } from "next/navigation";
import { AdminDenied, loadAdminGate } from "@/components/features/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminHubPage() {
  const gate = await loadAdminGate();
  if (!gate.ok) return <AdminDenied isDemo={gate.isDemo} />;
  redirect("/admin/users");
}

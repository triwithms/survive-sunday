import { AdminNav, loadAdminGate } from "@/components/features/admin";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const gate = await loadAdminGate();
  if (!gate.ok) return <>{children}</>;
  return (
    <div className="space-y-4">
      <AdminNav />
      {children}
    </div>
  );
}

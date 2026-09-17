import {
  AdminDenied,
  SystemScreen,
  loadSystemPage,
} from "@/components/features/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminSystemPage() {
  const data = await loadSystemPage();
  if (!data.ok) return <AdminDenied isDemo={data.isDemo} />;
  return <SystemScreen {...data.props} />;
}

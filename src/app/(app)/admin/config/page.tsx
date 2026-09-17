import {
  AdminDenied,
  ConfigScreen,
  loadConfigPage,
} from "@/components/features/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminConfigPage() {
  const data = await loadConfigPage();
  if (!data.ok) return <AdminDenied isDemo={data.isDemo} />;
  return <ConfigScreen {...data.props} />;
}

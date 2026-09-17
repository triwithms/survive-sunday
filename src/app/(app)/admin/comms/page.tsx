import {
  AdminDenied,
  CommsScreen,
  loadCommsPage,
} from "@/components/features/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminCommsPage() {
  const data = await loadCommsPage();
  if (!data.ok) return <AdminDenied isDemo={data.isDemo} />;
  return <CommsScreen {...data.props} />;
}

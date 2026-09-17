import {
  AdminDenied,
  UsersScreen,
  loadUsersPage,
} from "@/components/features/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminUsersPage() {
  const data = await loadUsersPage();
  if (!data.ok) return <AdminDenied isDemo={data.isDemo} />;
  return <UsersScreen {...data.props} />;
}

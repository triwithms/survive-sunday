import {
  AdminDenied,
  UsersScreen,
  loadUsersPage,
} from "@/components/features/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams?: Promise<{ member?: string | string[] }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const raw = params?.member;
  const openMemberId = typeof raw === "string" ? raw : null;
  const data = await loadUsersPage();
  if (!data.ok) return <AdminDenied isDemo={data.isDemo} />;
  return <UsersScreen {...data.props} openMemberId={openMemberId} />;
}

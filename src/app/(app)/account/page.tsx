import { AccountScreen, loadAccountPage } from "@/components/features/account";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AccountPage() {
  return <AccountScreen {...await loadAccountPage()} />;
}

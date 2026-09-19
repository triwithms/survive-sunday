import {
  AccountMirrorScreen,
  loadMirrorPage,
} from "@/components/features/account";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function MirrorPicksPage() {
  return <AccountMirrorScreen {...await loadMirrorPage()} />;
}

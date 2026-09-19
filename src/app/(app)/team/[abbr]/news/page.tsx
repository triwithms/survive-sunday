import { TeamNewsScreen, loadTeamPage } from "@/components/features/team";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function TeamNewsPage({
  params,
}: {
  params: Promise<{ abbr: string }>;
}) {
  const { abbr } = await params;
  return <TeamNewsScreen data={await loadTeamPage(abbr)} />;
}

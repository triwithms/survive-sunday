import { TeamScreen, loadTeamPage } from "@/components/features/team";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function TeamResearchPage({
  params,
}: {
  params: Promise<{ abbr: string }>;
}) {
  const { abbr } = await params;
  return <TeamScreen data={await loadTeamPage(abbr)} />;
}

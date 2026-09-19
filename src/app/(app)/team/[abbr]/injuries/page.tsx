import { TeamInjuriesScreen, loadTeamPage } from "@/components/features/team";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function TeamInjuriesPage({
  params,
}: {
  params: Promise<{ abbr: string }>;
}) {
  const { abbr } = await params;
  return <TeamInjuriesScreen data={await loadTeamPage(abbr)} />;
}

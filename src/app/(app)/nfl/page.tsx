import { LeagueScreen, loadLeaguePage } from "@/components/features/league";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function NflStandingsPage() {
  return <LeagueScreen {...await loadLeaguePage()} />;
}

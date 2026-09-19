import { TeamUnitScreen, loadTeamUnit } from "@/components/features/team";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function TeamOffencePage({
  params,
  searchParams,
}: {
  params: Promise<{ abbr: string }>;
  searchParams?: Promise<{ all?: string | string[] }>;
}) {
  const { abbr } = await params;
  const { data, showAll } = await loadTeamUnit(abbr, searchParams);
  return <TeamUnitScreen data={data} unit="offence" showAll={showAll} />;
}

import {
  TeamScheduleScreen,
  loadTeamSchedule,
} from "@/components/features/team";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function TeamSchedulePage({
  params,
}: {
  params: Promise<{ abbr: string }>;
}) {
  const { abbr } = await params;
  return <TeamScheduleScreen data={await loadTeamSchedule(abbr)} />;
}

import { EmptyWeeksNotice } from "@/components/EmptyWeeksNotice";
import {
  ScheduleScreen,
  loadSchedulePage,
} from "@/components/features/schedule";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ScheduleSearchParams = { week?: string | string[]; game?: string | string[] };

export default async function SchedulePage({
  searchParams,
}: {
  searchParams?: Promise<ScheduleSearchParams>;
}) {
  const data = await loadSchedulePage(await searchParams);
  if (!data) return <EmptyWeeksNotice />;
  return <ScheduleScreen {...data} />;
}

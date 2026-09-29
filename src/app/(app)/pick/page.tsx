import { EmptyWeeksNotice } from "@/components/EmptyWeeksNotice";
import { LiveScoresRefresh } from "@/components/LiveScoresRefresh";
import { PickClient } from "@/components/PickClient";
import { SectionBoundary } from "@/components/SectionBoundary";
import { loadPickPage } from "@/components/features/pick/load-pick";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PickSearchParams = { week?: string | string[] };

export default async function PickPage({
  searchParams,
}: {
  searchParams?: Promise<PickSearchParams>;
}) {
  const data = await loadPickPage(await searchParams);
  if (!data) return <EmptyWeeksNotice />;
  const { poll, ...client } = data;
  return (
    <>
      <SectionBoundary name="pick-live-refresh" variant="inline" message="Live score refresh paused.">
        <LiveScoresRefresh weekNumber={client.weekNumber} poll={poll} />
      </SectionBoundary>
      <PickClient key={client.weekNumber} {...client} />
    </>
  );
}

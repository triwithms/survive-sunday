import { EmptyWeeksNotice } from "@/components/EmptyWeeksNotice";
import { LiveScoresRefresh } from "@/components/LiveScoresRefresh";
import { PickClient } from "@/components/PickClient";
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
      <LiveScoresRefresh weekNumber={client.weekNumber} poll={poll} />
      <PickClient key={client.weekNumber} {...client} />
    </>
  );
}

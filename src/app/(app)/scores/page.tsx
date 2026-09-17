import { EmptyWeeksNotice } from "@/components/EmptyWeeksNotice";
import { ScoresScreen } from "@/components/features/scores/ScoresScreen";
import { loadScoresPage } from "@/components/features/scores/load-scores";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ScoresSearchParams = { week?: string | string[] };

export default async function ScoresPage({
  searchParams,
}: {
  searchParams?: Promise<ScoresSearchParams>;
}) {
  const data = await loadScoresPage(await searchParams);
  if (!data) return <EmptyWeeksNotice />;
  return <ScoresScreen {...data} />;
}

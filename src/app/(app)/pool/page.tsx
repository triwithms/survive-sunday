import { EmptyWeeksNotice } from "@/components/EmptyWeeksNotice";
import { HomeScreen, loadHomePage } from "@/components/features/home";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PoolSearchParams = { week?: string | string[] };

export default async function PoolPage({
  searchParams,
}: {
  searchParams?: Promise<PoolSearchParams>;
}) {
  const data = await loadHomePage(await searchParams);
  if (!data) return <EmptyWeeksNotice />;
  return <HomeScreen {...data} />;
}

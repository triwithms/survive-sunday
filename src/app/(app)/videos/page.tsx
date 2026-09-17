import { EmptyWeeksNotice } from "@/components/EmptyWeeksNotice";
import { VideosScreen, loadVideosPage } from "@/components/features/videos";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type VideosSearchParams = { week?: string | string[] };

export default async function VideosPage({
  searchParams,
}: {
  searchParams?: Promise<VideosSearchParams>;
}) {
  const data = await loadVideosPage(await searchParams);
  if (!data) return <EmptyWeeksNotice />;
  return <VideosScreen {...data} />;
}

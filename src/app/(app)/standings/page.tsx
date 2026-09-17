import { BoardScreen } from "@/components/features/board/BoardScreen";
import { loadBoardPage } from "@/components/features/board/load-board";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function StandingsPage() {
  return <BoardScreen {...await loadBoardPage()} />;
}

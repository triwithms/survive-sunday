import "server-only";
import { requireMembership } from "@/lib/require-membership";
import {
  loadParticipantWeeks,
  playerPickDecision,
  selectPageWeek,
  weekNavOptions,
} from "@/lib/page-week";
import type { VideosScreenProps } from "./types";

export async function loadVideosPage(searchParams?: {
  week?: string | string[];
}): Promise<VideosScreenProps | null> {
  const me = await requireMembership();
  const { currentWeek, weeks } = await loadParticipantWeeks(me);
  const decision = playerPickDecision(me, weeks, currentWeek);
  const selected = selectPageWeek({
    weeks,
    requested: searchParams?.week,
    basePath: "/videos",
    currentWeek,
    actionWeek: decision.actionWeek,
    allowFuture: true,
    fallbackFirst: true,
  });
  if (!selected) return null;
  return {
    weekLabel: selected.label,
    weekOptions: weekNavOptions(weeks),
    selectedWeek: selected.number,
    focusWeek: decision.actionWeek,
  };
}

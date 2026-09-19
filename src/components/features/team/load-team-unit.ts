import { loadTeamPage } from "./load-team";
import type { TeamPageData } from "./types";

type AllQuery = { all?: string | string[] };

export async function loadTeamUnit(
  raw: string,
  searchParams?: Promise<AllQuery>
): Promise<{ data: TeamPageData; showAll: boolean }> {
  const data = await loadTeamPage(raw);
  const query = searchParams ? await searchParams : {};
  const all = Array.isArray(query.all) ? query.all[0] : query.all;
  return { data, showAll: all === "1" };
}

/**
 * Allowlisted public YouTube channels. Friends stay on official / reputable
 * NFL sources — not random highlight farms or Madden sims.
 */

export type LeagueChannel = {
  id: string;
  label: string;
  rank: number;
};

export const YT_NFL = "UCDVYQ4Zhbm3S2dlz7P1GBDg";
export const YT_NFL_FILMS = "UCY3NEq2LYrmdoGkevo9BH5A";
export const YT_NFL_NETWORK = "UC_1H9v258pXiyLDaW0R5exw";
export const YT_NFL_ON_ESPN = "UCiio0ydw439X13KyZgMIcHw";
export const YT_ESPN = "UCiWLfSweyRNmLpgEHekhoAg";
export const YT_TSN_SPORTS = "UCLqU079f--SKnHANAgsF2eQ";

export const LEAGUE_CHANNELS: LeagueChannel[] = [
  { id: YT_NFL, label: "NFL", rank: 100 },
  { id: YT_NFL_FILMS, label: "NFL Films", rank: 90 },
  { id: YT_NFL_NETWORK, label: "NFL Network", rank: 85 },
  { id: YT_NFL_ON_ESPN, label: "NFL on ESPN", rank: 80 },
  { id: YT_ESPN, label: "ESPN", rank: 70 },
  { id: YT_TSN_SPORTS, label: "TSN", rank: 60 },
];

/** Official club channels (resolved from public @handles). */
export const TEAM_CHANNELS: Record<string, string> = {
  ARI: "UCzNfiKcvNjLHljohEkO83Rg",
  ATL: "UCzjCfV3LHyarKbdb-2ScGZg",
  BAL: "UCbpj2JAUMb8G_oQQFPeGrhg",
  BUF: "UCcEvCxUe2Sm5W6MliEUv0vg",
  CAR: "UC6vl4XAyO5mZLczhFC8MgpA",
  CHI: "UCP0Cdc6moLMyDJiO0s-yhbQ",
  CIN: "UCnQUpSnJ39KsjZKbT0CprHQ",
  CLE: "UCQQQO7Kdo0cu9iEb19qOoYA",
  DAL: "UCC0BPKJxAyxjQoRTYbpW0FQ",
  DEN: "UCDGdBexlDZA8T7hnweWWyow",
  DET: "UCv5J06V-ESk5_1uriG65f3w",
  GB: "UCJtI-l6La0zniodFtSHYrBg",
  HOU: "UCa_FcpOBe8G6VAR18RYS-aA",
  IND: "UCyYn26HPC4HIedifGnNbjBw",
  JAX: "UCsGacW6z0GedR-Wv45SBRZg",
  KC: "UC-hXefb6XBFSubWz6Ezf_lA",
  LV: "UC1es5fp8FEK1L0EgHjCvmtQ",
  LAC: "UCUyz_gEY_N-KBU4zjt2s-uQ",
  LAR: "UCyJ6yZdVUkBvt2vl4R03jcA",
  MIA: "UCHUSfEzpSRkUUsRkk_aJwDw",
  MIN: "UCcsw_KrB_wg5lQ5nXWR_LFA",
  NE: "UCMm_V8YjmnZRhToXIqDYDuw",
  NO: "UCwuddf1JrodMlc5fYpVlrQA",
  NYG: "UCk2FqoG8dN5EAz5WU3A0D7A",
  NYJ: "UCROj9vBjc4ZW3AL4cd_BjHg",
  PHI: "UCaogx6OHpsGg0zuGRKsjbtQ",
  PIT: "UChaRXjMDs4ppKfnTPE6Z89w",
  SF: "UCeIOarQkwmGhimim9cDUTng",
  SEA: "UCzkFCRiMcOBeef8xcaqipmw",
  TB: "UC0Wwu7r1ybaaR09ANhudTzA",
  TEN: "UCHBsqVkFraWvtNd1w0Qx4_g",
  WAS: "UC2a0ENbCZqIO5C1fWXGXZXA",
};

const LEAGUE_BY_ID = new Map(LEAGUE_CHANNELS.map((c) => [c.id, c]));
const TEAM_ABBR_BY_CHANNEL = new Map(
  Object.entries(TEAM_CHANNELS).map(([abbr, id]) => [id, abbr])
);

export function isLeagueChannel(channelId: string | null | undefined): boolean {
  return Boolean(channelId && LEAGUE_BY_ID.has(channelId));
}

export function teamAbbrForChannel(
  channelId: string | null | undefined
): string | null {
  if (!channelId) return null;
  return TEAM_ABBR_BY_CHANNEL.get(channelId) ?? null;
}

export function isAllowlistedChannel(
  channelId: string | null | undefined,
  extraTeamAbbrs: string[] = []
): boolean {
  if (!channelId) return false;
  if (LEAGUE_BY_ID.has(channelId)) return true;
  const team = TEAM_ABBR_BY_CHANNEL.get(channelId);
  if (!team) return false;
  if (!extraTeamAbbrs.length) return true;
  return extraTeamAbbrs.map((a) => a.toUpperCase()).includes(team);
}

export function channelLabel(
  channelId: string | null | undefined,
  fallback = "YouTube"
): string {
  if (!channelId) return fallback;
  const league = LEAGUE_BY_ID.get(channelId);
  if (league) return league.label;
  const abbr = TEAM_ABBR_BY_CHANNEL.get(channelId);
  return abbr ?? fallback;
}

export function channelRank(channelId: string | null | undefined): number {
  if (!channelId) return 0;
  const league = LEAGUE_BY_ID.get(channelId);
  if (league) return league.rank;
  if (TEAM_ABBR_BY_CHANNEL.has(channelId)) return 50;
  return 0;
}

export function leagueRssChannelIds(): string[] {
  return LEAGUE_CHANNELS.map((c) => c.id);
}

export function teamChannelId(abbr: string): string | null {
  return TEAM_CHANNELS[abbr.trim().toUpperCase()] ?? null;
}

export function teamRssChannelIds(abbrs: string[]): string[] {
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const abbr of abbrs) {
    const id = teamChannelId(abbr);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  return ids;
}

/**
 * Official NFL league channels set playableInEmbed=false. Website iframes
 * show YouTube’s “Video unavailable… blocked from display on this website”
 * overlay (and raw HTML like `<a href=…>`). Do not mount those iframes.
 */
export const CHANNELS_THAT_BLOCK_WEBSITE_EMBEDS = new Set<string>([
  YT_NFL,
  YT_NFL_FILMS,
  YT_NFL_NETWORK,
]);

export function channelBlocksWebsiteEmbeds(
  channelId: string | null | undefined
): boolean {
  return Boolean(channelId && CHANNELS_THAT_BLOCK_WEBSITE_EMBEDS.has(channelId));
}

/**
 * Never mount a website iframe. NFL official clips (and many others) show
 * YouTube’s “Video unavailable… blocked from display on this website”
 * overlay and raw HTML. Friends always get thumbnail + Watch on YouTube.
 */
export function shouldMountYoutubeIframe(clip: {
  embeddable?: boolean;
  channelId: string | null | undefined;
}): boolean {
  void clip;
  return false;
}

/** Static NFL names for video title matching. Not a live feed. */

export type NflTeamMeta = {
  abbr: string;
  name: string;
  city: string;
  nickname: string;
  /** Word-boundary aliases. No shared cities (New York / Los Angeles). */
  aliases: string[];
};

export const NFL_TEAM_META: Record<string, NflTeamMeta> = {
  ARI: {
    abbr: "ARI",
    name: "Arizona Cardinals",
    city: "Arizona",
    nickname: "Cardinals",
    aliases: ["Cardinals", "Arizona Cardinals"],
  },
  ATL: {
    abbr: "ATL",
    name: "Atlanta Falcons",
    city: "Atlanta",
    nickname: "Falcons",
    aliases: ["Falcons", "Atlanta Falcons"],
  },
  BAL: {
    abbr: "BAL",
    name: "Baltimore Ravens",
    city: "Baltimore",
    nickname: "Ravens",
    aliases: ["Ravens", "Baltimore Ravens"],
  },
  BUF: {
    abbr: "BUF",
    name: "Buffalo Bills",
    city: "Buffalo",
    nickname: "Bills",
    aliases: ["Bills", "Buffalo Bills"],
  },
  CAR: {
    abbr: "CAR",
    name: "Carolina Panthers",
    city: "Carolina",
    nickname: "Panthers",
    aliases: ["Panthers", "Carolina Panthers"],
  },
  CHI: {
    abbr: "CHI",
    name: "Chicago Bears",
    city: "Chicago",
    nickname: "Bears",
    aliases: ["Bears", "Chicago Bears"],
  },
  CIN: {
    abbr: "CIN",
    name: "Cincinnati Bengals",
    city: "Cincinnati",
    nickname: "Bengals",
    aliases: ["Bengals", "Cincinnati Bengals"],
  },
  CLE: {
    abbr: "CLE",
    name: "Cleveland Browns",
    city: "Cleveland",
    nickname: "Browns",
    aliases: ["Browns", "Cleveland Browns"],
  },
  DAL: {
    abbr: "DAL",
    name: "Dallas Cowboys",
    city: "Dallas",
    nickname: "Cowboys",
    aliases: ["Cowboys", "Dallas Cowboys"],
  },
  DEN: {
    abbr: "DEN",
    name: "Denver Broncos",
    city: "Denver",
    nickname: "Broncos",
    aliases: ["Broncos", "Denver Broncos", "Denver"],
  },
  DET: {
    abbr: "DET",
    name: "Detroit Lions",
    city: "Detroit",
    nickname: "Lions",
    aliases: ["Lions", "Detroit Lions"],
  },
  GB: {
    abbr: "GB",
    name: "Green Bay Packers",
    city: "Green Bay",
    nickname: "Packers",
    aliases: ["Packers", "Green Bay", "Green Bay Packers"],
  },
  HOU: {
    abbr: "HOU",
    name: "Houston Texans",
    city: "Houston",
    nickname: "Texans",
    aliases: ["Texans", "Houston Texans"],
  },
  IND: {
    abbr: "IND",
    name: "Indianapolis Colts",
    city: "Indianapolis",
    nickname: "Colts",
    aliases: ["Colts", "Indianapolis Colts"],
  },
  JAX: {
    abbr: "JAX",
    name: "Jacksonville Jaguars",
    city: "Jacksonville",
    nickname: "Jaguars",
    aliases: ["Jaguars", "Jags", "Jacksonville", "Jax"],
  },
  KC: {
    abbr: "KC",
    name: "Kansas City Chiefs",
    city: "Kansas City",
    nickname: "Chiefs",
    aliases: ["Chiefs", "Kansas City Chiefs", "Kansas City"],
  },
  LV: {
    abbr: "LV",
    name: "Las Vegas Raiders",
    city: "Las Vegas",
    nickname: "Raiders",
    aliases: ["Raiders", "Las Vegas Raiders"],
  },
  LAC: {
    abbr: "LAC",
    name: "Los Angeles Chargers",
    city: "Los Angeles",
    nickname: "Chargers",
    aliases: ["Chargers", "LA Chargers", "Los Angeles Chargers"],
  },
  LAR: {
    abbr: "LAR",
    name: "Los Angeles Rams",
    city: "Los Angeles",
    nickname: "Rams",
    aliases: ["Rams", "LA Rams", "Los Angeles Rams"],
  },
  MIA: {
    abbr: "MIA",
    name: "Miami Dolphins",
    city: "Miami",
    nickname: "Dolphins",
    aliases: ["Dolphins", "Miami Dolphins"],
  },
  MIN: {
    abbr: "MIN",
    name: "Minnesota Vikings",
    city: "Minnesota",
    nickname: "Vikings",
    aliases: ["Vikings", "Minnesota Vikings"],
  },
  NE: {
    abbr: "NE",
    name: "New England Patriots",
    city: "New England",
    nickname: "Patriots",
    aliases: ["Patriots", "Pats", "New England Patriots"],
  },
  NO: {
    abbr: "NO",
    name: "New Orleans Saints",
    city: "New Orleans",
    nickname: "Saints",
    aliases: ["Saints", "New Orleans Saints"],
  },
  NYG: {
    abbr: "NYG",
    name: "New York Giants",
    city: "New York",
    nickname: "Giants",
    aliases: ["Giants", "NY Giants", "New York Giants"],
  },
  NYJ: {
    abbr: "NYJ",
    name: "New York Jets",
    city: "New York",
    nickname: "Jets",
    aliases: ["Jets", "NY Jets", "New York Jets"],
  },
  PHI: {
    abbr: "PHI",
    name: "Philadelphia Eagles",
    city: "Philadelphia",
    nickname: "Eagles",
    aliases: ["Eagles", "Philadelphia Eagles"],
  },
  PIT: {
    abbr: "PIT",
    name: "Pittsburgh Steelers",
    city: "Pittsburgh",
    nickname: "Steelers",
    aliases: ["Steelers", "Pittsburgh Steelers"],
  },
  SF: {
    abbr: "SF",
    name: "San Francisco 49ers",
    city: "San Francisco",
    nickname: "49ers",
    aliases: ["49ers", "Niners", "San Francisco 49ers"],
  },
  SEA: {
    abbr: "SEA",
    name: "Seattle Seahawks",
    city: "Seattle",
    nickname: "Seahawks",
    aliases: ["Seahawks", "Seattle Seahawks"],
  },
  TB: {
    abbr: "TB",
    name: "Tampa Bay Buccaneers",
    city: "Tampa Bay",
    nickname: "Buccaneers",
    aliases: ["Buccaneers", "Bucs", "Tampa Bay"],
  },
  TEN: {
    abbr: "TEN",
    name: "Tennessee Titans",
    city: "Tennessee",
    nickname: "Titans",
    aliases: ["Titans", "Tennessee Titans"],
  },
  WAS: {
    abbr: "WAS",
    name: "Washington Commanders",
    city: "Washington",
    nickname: "Commanders",
    aliases: ["Commanders", "Washington Commanders"],
  },
};

export function teamMeta(abbr: string): NflTeamMeta | null {
  return NFL_TEAM_META[abbr.trim().toUpperCase()] ?? null;
}

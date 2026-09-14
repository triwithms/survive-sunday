/** Shared ESPN mark sizes. Compact is the default for Scores / Board / League rows. */
export const TEAM_LOGO_SIZE = {
  /** Scores game rows + friend picks — phone-readable, scorebug-safe. */
  compact: 44,
  /** Board, League, Scores detail — same family, a bit more room. */
  row: 48,
  /** Pick slate matchup sides. */
  slate: 66,
  /** Current pick / confirm dialog. */
  featured: 84,
  /** Team research header only — do not use in lists. */
  hero: 96,
} as const;

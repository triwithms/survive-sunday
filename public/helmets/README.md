# Local helmet backups

Committed ESPN NFL team marks for all 32 clubs used in Survive Sunday.

- Files: `{abbr}.png` using **app** abbreviations (`was.png`, not ESPN’s `wsh.png`).
- Source (downloaded once): `https://a.espncdn.com/i/teamlogos/nfl/500/{espnAbbr}.png`
  - Washington CDN slug is `wsh`; we save it as `was.png`.
- `_placeholder.svg` is a neutral helmet graphic (no letters) if both local and ESPN fail.

`TeamLogo` tries local first, then the ESPN CDN URL. It never shows abbreviation letter badges.

Robert Gama accepts responsibility for storing these local/saved helmet image backups.

Team marks © the respective NFL clubs / ESPN. Cached here as display backups for a private friends pool.

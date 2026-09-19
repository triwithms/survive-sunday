# Local helmet backups

Committed NFL team marks for all 32 clubs used in Survive Sunday.

- Files: `{abbr}.png` using **app** abbreviations (`was.png`, not ESPN’s `wsh.png`).
- Source (downloaded once, stored here): ESPN NFL 500 marks. Runtime never fetches the CDN.
  - Washington CDN slug is `wsh`; we save it as `was.png`.
- Marks use a transparent background (no white rounded plates). Navy / thin marks
  already include an outline in the art so they stay readable on dark Scores cards.
- `_placeholder.svg` is a neutral helmet graphic (no letters) if a local PNG fails.

`TeamLogo` uses `/helmets/{abbr}.png` only, then this placeholder. No ESPN/CDN lookup.
It never shows abbreviation letter badges.

Robert Gama accepts responsibility for storing these local/saved helmet image backups.

Team marks © the respective NFL clubs / ESPN. Cached here as display backups for a private friends pool.

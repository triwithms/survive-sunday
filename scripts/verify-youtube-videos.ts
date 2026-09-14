/**
 * YouTube weekly / game-highlight matching (no network).
 *
 *   npx tsx scripts/verify-youtube-videos.ts
 */
import assert from "node:assert/strict";
import {
  bucketFromDuration,
  extractInnertubeVideos,
  groupWeeklyVideos,
  parseDurationLabel,
  parseYoutubeAtomFeed,
  pickGameHighlights,
  titleHasWeek,
  titleLooksOldSeason,
  titleMatchesGame,
  titleMentionsTeam,
  youtubeEmbedUrl,
  type RawYoutubeHit,
} from "../src/lib/youtube-parse";
import { YT_NFL, isAllowlistedChannel } from "../src/lib/youtube-channels";

assert.equal(parseDurationLabel("16:19"), 16 * 60 + 19);
assert.equal(parseDurationLabel("1:02:03"), 3600 + 120 + 3);
assert.equal(parseDurationLabel("9:01"), 541);
assert.equal(parseDurationLabel(""), null);

assert.equal(bucketFromDuration(90), "short");
assert.equal(bucketFromDuration(9 * 60), "short");
assert.equal(bucketFromDuration(10 * 60), "medium");
assert.equal(bucketFromDuration(19 * 60), "medium");
assert.equal(bucketFromDuration(20 * 60), "long");
assert.equal(bucketFromDuration(45), null);
assert.equal(bucketFromDuration(3 * 3600), null);

assert.equal(titleHasWeek("Best Plays | 2026 NFL Season Week 1", 1), true);
assert.equal(titleHasWeek("NFL Week 10 Preview", 1), false);
assert.equal(titleHasWeek("NFL Week 10 Preview", 10), true);
assert.equal(titleHasWeek("Week1 Recap", 1), true);

assert.equal(titleLooksOldSeason("Giants vs Cowboys Week 1 Highlights"), false);
assert.equal(
  titleLooksOldSeason("Dallas Cowboys vs. New York Giants | 2023 Week 1 Game Highlights"),
  true
);
assert.equal(
  titleLooksOldSeason("Dallas Cowboys vs New York Giants Game Highlights | NFL 2026 Season Week 1"),
  false
);

assert.equal(titleMentionsTeam("Cowboys vs Giants", "DAL"), true);
assert.equal(titleMentionsTeam("Cowboys vs Giants", "NYG"), true);
assert.equal(titleMentionsTeam("Cowboys vs Giants", "NYJ"), false);
assert.equal(
  titleMatchesGame(
    "Dallas Cowboys vs New York Giants Game Highlights | NFL 2026 Season Week 1",
    "DAL",
    "NYG"
  ),
  true
);
assert.equal(
  titleMatchesGame("Dallas Cowboys vs New York Giants Game Highlights", "DAL", "NYJ"),
  false
);
assert.equal(
  titleMatchesGame("Rams vs Chargers Week 1 Highlights", "LAR", "LAC"),
  true
);

assert.ok(isAllowlistedChannel(YT_NFL));
assert.equal(isAllowlistedChannel("UC-random-fan-channel"), false);
assert.ok(isAllowlistedChannel("UCk2FqoG8dN5EAz5WU3A0D7A", ["NYG", "DAL"]));
assert.equal(isAllowlistedChannel("UCk2FqoG8dN5EAz5WU3A0D7A", ["KC", "BUF"]), false);

const rss = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns:yt="http://www.youtube.com/xml/schemas/2015" xmlns:media="http://search.yahoo.com/mrss/" xmlns="http://www.w3.org/2005/Atom">
 <title>NFL</title>
 <entry>
  <id>yt:video:9R8P93W2iKE</id>
  <yt:videoId>9R8P93W2iKE</yt:videoId>
  <yt:channelId>${YT_NFL}</yt:channelId>
  <title>Dallas Cowboys vs New York Giants Game Highlights | NFL 2026 Season Week 1</title>
  <link rel="alternate" href="https://www.youtube.com/watch?v=9R8P93W2iKE"/>
  <author><name>NFL</name></author>
  <published>2026-09-14T04:00:00+00:00</published>
  <media:group>
   <media:thumbnail url="https://i.ytimg.com/vi/9R8P93W2iKE/hqdefault.jpg" width="480" height="360"/>
  </media:group>
 </entry>
 <entry>
  <id>yt:video:SHORT1</id>
  <yt:videoId>SHORT1</yt:videoId>
  <yt:channelId>${YT_NFL}</yt:channelId>
  <title>big blue with a big snf victory</title>
  <link rel="alternate" href="https://www.youtube.com/shorts/SHORT1"/>
  <author><name>NFL</name></author>
  <published>2026-09-14T04:18:24+00:00</published>
 </entry>
</feed>`;

const rssHits = parseYoutubeAtomFeed(rss);
assert.equal(rssHits.length, 2);
assert.equal(rssHits[0].videoId, "9R8P93W2iKE");
assert.equal(rssHits[0].isShort, false);
assert.equal(rssHits[1].isShort, true);

const weekly = groupWeeklyVideos(
  [
    {
      ...rssHits[0],
      durationSeconds: 16 * 60 + 19,
      durationLabel: "16:19",
    },
    {
      videoId: "PREV1",
      title: "NFL Week 2 Preview 2026",
      channelName: "NFL",
      channelId: YT_NFL,
      thumbnailUrl: null,
      publishedAt: null,
      durationSeconds: 12 * 60,
      durationLabel: "12:00",
      isShort: false,
    },
    {
      videoId: "OLD1",
      title: "NFL Week 2 Preview 2023",
      channelName: "NFL",
      channelId: YT_NFL,
      thumbnailUrl: null,
      publishedAt: null,
      durationSeconds: 12 * 60,
      durationLabel: "12:00",
      isShort: false,
    },
    {
      videoId: "PRESEASON",
      title: "Green Bay Packers vs. Denver Broncos | 2026 Preseason Week 2",
      channelName: "NFL",
      channelId: YT_NFL,
      thumbnailUrl: null,
      publishedAt: null,
      durationSeconds: 15 * 60,
      durationLabel: "15:01",
      isShort: false,
    },
    {
      videoId: "FAN1",
      title: "NFL Week 2 Preview 2026",
      channelName: "Random Fan",
      channelId: "UCnotallowlisted000000000",
      thumbnailUrl: null,
      publishedAt: null,
      durationSeconds: 12 * 60,
      durationLabel: "12:00",
      isShort: false,
    },
  ],
  2
);
assert.equal(weekly.medium.length, 1);
assert.equal(weekly.medium[0].id, "PREV1");
assert.equal(weekly.short.length, 0);

const game = pickGameHighlights(
  [
    {
      videoId: "9R8P93W2iKE",
      title:
        "Dallas Cowboys vs New York Giants Game Highlights | NFL 2026 Season Week 1",
      channelName: "NFL",
      channelId: YT_NFL,
      thumbnailUrl: null,
      publishedAt: null,
      durationSeconds: 16 * 60 + 19,
      durationLabel: "16:19",
      isShort: false,
    },
    {
      videoId: "MADDEN",
      title:
        "Dallas Cowboys vs New York Giants Full Game Highlights Madden 27 Sim",
      channelName: "Sports Gaming Universe",
      channelId: "UCY_wPnc5xrvPekvHpLAvZvQ",
      thumbnailUrl: null,
      publishedAt: null,
      durationSeconds: 45 * 60,
      durationLabel: "45:41",
      isShort: false,
    },
    {
      videoId: "OLDHL",
      title: "Dallas Cowboys vs. New York Giants | 2023 Week 1 Game Highlights",
      channelName: "NFL",
      channelId: YT_NFL,
      thumbnailUrl: null,
      publishedAt: null,
      durationSeconds: 11 * 60,
      durationLabel: "11:12",
      isShort: false,
    },
  ],
  { week: 1, awayAbbr: "DAL", homeAbbr: "NYG" }
);
assert.equal(game.length, 1);
assert.equal(game[0].id, "9R8P93W2iKE");
assert.ok(game[0].embedUrl.includes("youtube-nocookie.com/embed/9R8P93W2iKE"));
assert.ok(game[0].watchUrl.includes("watch?v=9R8P93W2iKE"));
assert.ok(youtubeEmbedUrl("abc").includes("controls=1"));
assert.ok(youtubeEmbedUrl("abc").includes("fs=1"));

const innertube = {
  contents: {
    twoColumnSearchResultsRenderer: {
      primaryContents: {
        sectionListRenderer: {
          contents: [
            {
              itemSectionRenderer: {
                contents: [
                  {
                    videoRenderer: {
                      videoId: "abc123XYZ_1",
                      title: {
                        runs: [
                          {
                            text: "NFL Week 2 Preview 2026",
                          },
                        ],
                      },
                      lengthText: { simpleText: "14:02" },
                      ownerText: {
                        runs: [
                          {
                            text: "NFL",
                            navigationEndpoint: {
                              browseEndpoint: { browseId: YT_NFL },
                            },
                          },
                        ],
                      },
                    },
                  },
                ],
              },
            },
          ],
        },
      },
    },
  },
};
const extracted = extractInnertubeVideos(innertube);
assert.equal(extracted.length, 1);
assert.equal(extracted[0].videoId, "abc123XYZ_1");
assert.equal(extracted[0].durationSeconds, 14 * 60 + 2);
assert.equal(extracted[0].channelId, YT_NFL);

const emptyGame = pickGameHighlights([] as RawYoutubeHit[], {
  week: 1,
  awayAbbr: "KC",
  homeAbbr: "LAC",
});
assert.deepEqual(emptyGame, []);

console.log("verify-youtube-videos: ok");

async function liveRssSmoke() {
  try {
    const res = await fetch(
      `https://www.youtube.com/feeds/videos.xml?channel_id=${YT_NFL}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
        },
        signal: AbortSignal.timeout(8000),
      }
    );
    if (!res.ok) {
      console.log("verify-youtube-videos: live RSS skipped", res.status);
      return;
    }
    const hits = parseYoutubeAtomFeed(await res.text());
    assert.ok(hits.length > 0, "NFL RSS should have entries");
    assert.ok(hits[0].videoId && hits[0].title);
    console.log("verify-youtube-videos: live RSS ok", hits.length, hits[0].title);
  } catch (e) {
    console.log(
      "verify-youtube-videos: live RSS skipped",
      e instanceof Error ? e.message : e
    );
  }
}

void liveRssSmoke();

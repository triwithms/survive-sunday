import assert from "node:assert/strict";
import { pickTouchdownClip, titleStartsTouchdownWeek } from "../../src/lib/week-wrap-touchdown";
import { findWeekTouchdownVideo } from "../../src/lib/week-wrap-youtube";
import { YT_NFL } from "../../src/lib/youtube-channels";

assert.equal(titleStartsTouchdownWeek("Every Touchdown of Week 3", 3), true);
assert.equal(titleStartsTouchdownWeek("Every Touchdown of Week 3 | 2026 NFL Season", 3), true);
assert.equal(titleStartsTouchdownWeek("Every Touchdown of Week 13", 3), false);
assert.equal(titleStartsTouchdownWeek("Every Touchdown of Week 13", 1), false);
assert.equal(titleStartsTouchdownWeek("Week 3 every touchdown", 3), false);

const picked = pickTouchdownClip(
  {
    items: [
      {
        id: { videoId: "old" },
        snippet: {
          title: "Every Touchdown of Week 3 | 2024",
          publishedAt: "2024-09-20T00:00:00Z",
          thumbnails: { high: { url: "https://img.example/old.jpg" } },
        },
      },
      {
        id: { videoId: "new" },
        snippet: {
          title: "Every Touchdown of Week 3",
          publishedAt: "2026-09-22T00:00:00Z",
          thumbnails: { medium: { url: "https://img.example/new.jpg" } },
        },
      },
      {
        id: { videoId: "other" },
        snippet: { title: "Every Touchdown of Week 13", publishedAt: "2026-12-01T00:00:00Z" },
      },
    ],
  },
  3
);
assert.equal(picked?.videoId, "new");
assert.equal(picked?.thumbUrl, "https://img.example/new.jpg");

export async function verifyTouchdownSearch() {
  let fetches = 0;
  const missed = await findWeekTouchdownVideo(3, {
    apiKey: "",
    fetchImpl: async () => {
      fetches += 1;
      throw new Error("should not fetch");
    },
  });
  assert.equal(missed, null);
  assert.equal(fetches, 0);
  const failed = await findWeekTouchdownVideo(3, {
    apiKey: "test-key",
    fetchImpl: async () => new Response("nope", { status: 403 }),
  });
  assert.equal(failed, null);
  let searched = "";
  const found = await findWeekTouchdownVideo(3, {
    apiKey: "test-key",
    seasonYear: 2026,
    fetchImpl: async (input) => {
      searched = String(input);
      return new Response(
        JSON.stringify({
          items: [
            {
              id: { videoId: "td1" },
              snippet: {
                title: "Every Touchdown of Week 3 | 2026",
                publishedAt: "2026-09-23T16:00:00Z",
                thumbnails: { high: { url: "https://img.example/td.jpg" } },
              },
            },
          ],
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    },
  });
  assert.equal(found?.videoId, "td1");
  assert.match(searched, new RegExp(`channelId=${YT_NFL}`));
  assert.match(searched, /publishedAfter=2026-08-01/);
  assert.match(searched, /key=test-key/);
  console.log("PASS  touchdown search");
}

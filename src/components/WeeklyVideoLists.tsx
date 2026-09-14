"use client";

import { YouTubeEmbed } from "@/components/YouTubeEmbed";
import type { VideoClip, VideoGroups } from "@/lib/youtube-parse";

const BUCKETS: Array<{
  key: keyof VideoGroups;
  label: string;
  hint: string;
}> = [
  { key: "short", label: "Short", hint: "About 5–10 min" },
  { key: "medium", label: "Medium", hint: "About 10–20 min" },
  { key: "long", label: "Longer look", hint: "20 min and up" },
];

export function WeeklyVideoLists({
  groups,
  unavailable,
  nflChannelUrl,
}: {
  groups: VideoGroups;
  unavailable?: boolean;
  nflChannelUrl: string;
}) {
  const empty =
    groups.short.length + groups.medium.length + groups.long.length === 0;

  if (unavailable && empty) {
    return (
      <p className="text-sm text-[var(--text-muted)]">
        Couldn’t load videos right now.{" "}
        <a
          href={nflChannelUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gold-400 underline-offset-2 hover:underline"
        >
          Open NFL on YouTube
        </a>
      </p>
    );
  }

  if (empty) {
    return (
      <p className="text-sm text-[var(--text-muted)]">
        Nothing posted for this week yet. NFL usually adds previews mid-week
        and highlights after games.{" "}
        <a
          href={nflChannelUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gold-400 underline-offset-2 hover:underline"
        >
          Open NFL on YouTube
        </a>
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {BUCKETS.map(({ key, label, hint }) => {
        const list = groups[key];
        if (!list.length) return null;
        return (
          <section key={key} aria-label={label}>
            <div className="mb-2 flex items-baseline justify-between gap-2">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-gold-400">
                {label}
              </h2>
              <span className="text-[10px] text-[var(--text-muted)]">{hint}</span>
            </div>
            <ul className="space-y-4">
              {list.map((video: VideoClip) => (
                <li key={video.id}>
                  <YouTubeEmbed video={video} />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

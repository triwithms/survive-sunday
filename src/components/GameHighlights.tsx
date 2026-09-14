"use client";

import { useEffect, useState } from "react";
import { YouTubeEmbed } from "@/components/YouTubeEmbed";
import type { VideoClip } from "@/lib/youtube-parse";

type Payload = {
  ok: true;
  videos: VideoClip[];
  unavailable: boolean;
  searchUrl: string;
  phase?: "preview" | "highlight";
};

export function GameHighlights({
  gameId,
  status,
}: {
  gameId: string;
  status: string;
}) {
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const live = status === "live";
  const final = status === "final";
  const phase = data?.phase ?? (live || final ? "highlight" : "preview");
  const preview = phase === "preview";

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/videos/game?gameId=${encodeURIComponent(gameId)}`, {
      cache: "no-store",
    })
      .then(async (res) => {
        const json = (await res.json()) as Payload & { error?: string };
        if (!res.ok) throw new Error(json.error || "Couldn’t load videos");
        if (!cancelled) setData(json);
      })
      .catch(() => {
        if (!cancelled) {
          setData({
            ok: true,
            videos: [],
            unavailable: true,
            phase: live || final ? "highlight" : "preview",
            searchUrl: "https://www.youtube.com/@NFL",
          });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [gameId, live, final]);

  const videos = data?.videos ?? [];

  return (
    <section>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-gold-400 mb-1.5">
        {preview ? "Preview" : "Highlights"}
      </h3>
      {loading && !data ? (
        <p className="text-xs text-[var(--text-muted)]">
          {preview
            ? "Looking for YouTube previews…"
            : "Looking for YouTube highlights…"}
        </p>
      ) : videos.length ? (
        <ul className="space-y-3">
          {videos.map((video) => (
            <li key={video.id}>
              <YouTubeEmbed video={video} compact />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-[var(--text-muted)]">
          {data?.unavailable
            ? "Couldn’t load videos."
            : preview
              ? "No YouTube preview yet — team and league clips usually land before kickoff."
              : "No YouTube highlights yet — they usually land during the game or after the final."}{" "}
          {data?.searchUrl ? (
            <a
              href={data.searchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold-400 underline-offset-2 hover:underline"
            >
              Watch on YouTube
            </a>
          ) : null}
        </p>
      )}
    </section>
  );
}

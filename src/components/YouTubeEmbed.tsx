"use client";

import { useEffect, useId, useState } from "react";
import type { VideoClip } from "@/lib/youtube-parse";

type Props = {
  video: VideoClip;
  /** When set, only this id plays (one at a time). */
  playingId?: string | null;
  onPlay?: (id: string) => void;
  compact?: boolean;
};

export function YouTubeEmbed({ video, playingId, onPlay, compact }: Props) {
  const titleId = useId();
  const playing = playingId ? playingId === video.id : undefined;
  const [localOn, setLocalOn] = useState(false);
  const [embedFailed, setEmbedFailed] = useState(false);
  const active = playing ?? localOn;

  useEffect(() => {
    if (playing === false) setLocalOn(false);
  }, [playing]);

  function play() {
    setEmbedFailed(false);
    setLocalOn(true);
    onPlay?.(video.id);
  }

  return (
    <article className="min-w-0">
      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-stadium-900 border border-stadium-border">
        {active && !embedFailed ? (
          <iframe
            title={video.title}
            src={`${video.embedUrl}&autoplay=1`}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            onError={() => setEmbedFailed(true)}
          />
        ) : (
          <button
            type="button"
            onClick={play}
            className="absolute inset-0 block w-full h-full text-left"
            aria-labelledby={titleId}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={video.thumbnailUrl}
              alt=""
              className="h-full w-full object-cover"
            />
            <span
              className="absolute inset-0 bg-black/25"
              aria-hidden
            />
            <span
              className="absolute inset-0 flex items-center justify-center"
              aria-hidden
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/70 text-white ring-2 ring-white/80">
                <svg viewBox="0 0 24 24" className="h-6 w-6 ml-0.5" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
            </span>
          </button>
        )}
      </div>
      <div className={compact ? "mt-1.5 space-y-0.5" : "mt-2 space-y-1"}>
        <h3
          id={titleId}
          className={`text-[var(--text-primary)] leading-snug ${
            compact ? "text-xs font-medium line-clamp-2" : "text-sm font-medium"
          }`}
        >
          {video.title}
        </h3>
        <p className="text-[10px] text-[var(--text-muted)]">
          {video.channel}
          {video.durationLabel ? ` · ${video.durationLabel}` : ""}
        </p>
        <p className="text-[11px]">
          <a
            href={video.watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold-400 underline-offset-2 hover:underline"
          >
            Open in YouTube
          </a>
          {embedFailed ? " — this player was blocked here." : ""}
        </p>
      </div>
    </article>
  );
}

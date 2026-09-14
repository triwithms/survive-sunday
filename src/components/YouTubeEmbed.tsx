"use client";

import { useId } from "react";
import type { VideoClip } from "@/lib/youtube-parse";

type Props = {
  video: VideoClip;
  compact?: boolean;
};

function WatchOnYouTubeButton({
  href,
  compact,
}: {
  href: string;
  compact?: boolean;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`btn-primary inline-flex items-center justify-center text-center ${
        compact ? "text-xs min-h-10 px-3 py-2" : "text-sm"
      }`}
    >
      Watch on YouTube
    </a>
  );
}

/**
 * Thumbnail + title card. Tap opens YouTube (app or browser).
 * Never mounts an iframe — NFL blocks website embeds (“Video unavailable”
 * plus raw HTML). Same treatment for previews and highlights.
 */
export function YouTubeEmbed({ video, compact }: Props) {
  const titleId = useId();

  return (
    <article className="min-w-0">
      <a
        href={video.watchUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="relative aspect-video w-full overflow-hidden rounded-lg bg-stadium-900 border border-stadium-border block"
        aria-labelledby={titleId}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={video.thumbnailUrl}
          alt=""
          className="h-full w-full object-cover"
        />
        <span className="absolute inset-0 bg-black/25" aria-hidden />
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
      </a>
      <div className={compact ? "mt-1.5 space-y-1" : "mt-2 space-y-1.5"}>
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
        <div className="space-y-1">
          <WatchOnYouTubeButton href={video.watchUrl} compact={compact} />
          <p className="text-[10px] text-[var(--text-muted)]">
            Opens YouTube. Switch back here when you’re done.
          </p>
        </div>
      </div>
    </article>
  );
}

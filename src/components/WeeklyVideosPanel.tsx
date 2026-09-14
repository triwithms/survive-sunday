"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { VideoClip, VideoGroups } from "@/lib/youtube-parse";
import { WeeklyVideoLists } from "@/components/WeeklyVideoLists";

type WeekPayload = {
  ok: true;
  week: number;
  groups: VideoGroups;
  unavailable: boolean;
  nflChannelUrl: string;
};

function emptyGroups(): VideoGroups {
  return { short: [], medium: [], long: [] };
}

export function WeeklyVideosPanel({ week }: { week: number }) {
  const [data, setData] = useState<WeekPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/videos/week?week=${encodeURIComponent(String(week))}`, {
      cache: "no-store",
    })
      .then(async (res) => {
        const json = (await res.json()) as WeekPayload & { error?: string };
        if (!res.ok) throw new Error(json.error || "Couldn’t load videos");
        if (!cancelled) setData(json);
      })
      .catch(() => {
        if (!cancelled) {
          setData({
            ok: true,
            week,
            groups: emptyGroups(),
            unavailable: true,
            nflChannelUrl: "https://www.youtube.com/@NFL",
          });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [week]);

  if (loading && !data) {
    return <p className="text-sm text-[var(--text-muted)]">Loading videos…</p>;
  }

  return (
    <WeeklyVideoLists
      groups={data?.groups ?? emptyGroups()}
      unavailable={data?.unavailable}
      nflChannelUrl={data?.nflChannelUrl ?? "https://www.youtube.com/@NFL"}
    />
  );
}

export function HomeVideosTeaser({ week }: { week: number }) {
  const [thumbs, setThumbs] = useState<VideoClip[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/videos/week?week=${encodeURIComponent(String(week))}`, {
      cache: "no-store",
    })
      .then(async (res) => {
        if (!res.ok) return;
        const json = (await res.json()) as WeekPayload;
        const list = [
          ...json.groups.short,
          ...json.groups.medium,
          ...json.groups.long,
        ].slice(0, 3);
        if (!cancelled) setThumbs(list);
      })
      .catch(() => {
        /* Home must not break if YouTube is down. */
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [week]);

  const href = `/videos?week=${week}`;

  if (ready && thumbs.length === 0) {
    return (
      <section className="card-glass p-4">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
            Week {week} videos
          </h2>
          <Link
            href={href}
            prefetch={false}
            className="text-xs text-gold-400 underline-offset-2 hover:underline"
          >
            Open Videos
          </Link>
        </div>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Previews and highlights when NFL posts them.
        </p>
      </section>
    );
  }

  return (
    <section className="card-glass p-4 space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
          Week {week} videos
        </h2>
        <Link
          href={href}
          prefetch={false}
          className="text-xs text-gold-400 underline-offset-2 hover:underline"
        >
          See all
        </Link>
      </div>
      {thumbs.length > 0 ? (
        <ul className="grid grid-cols-3 gap-2">
          {thumbs.map((v) => (
            <li key={v.id}>
              <a
                href={v.watchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block min-w-0"
              >
                <span className="relative block aspect-video overflow-hidden rounded-md border border-stadium-border bg-stadium-900">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={v.thumbnailUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </span>
                <span className="mt-1 block text-[10px] leading-snug text-[var(--text-primary)] line-clamp-2">
                  {v.title}
                </span>
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-[var(--text-muted)]">Looking up this week’s videos…</p>
      )}
    </section>
  );
}

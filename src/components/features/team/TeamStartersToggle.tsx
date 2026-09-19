"use client";

import { usePathname, useRouter } from "next/navigation";

export function TeamStartersToggle({
  startersOnly,
  starterCount,
}: {
  startersOnly: boolean;
  starterCount: number;
}) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <label className="flex items-center gap-3 min-h-11 text-base">
      <input
        type="checkbox"
        className="h-5 w-5 accent-gold-400"
        checked={startersOnly}
        onChange={(event) => {
          const next = event.target.checked
            ? pathname
            : `${pathname}?all=1`;
          router.replace(next, { scroll: false });
        }}
      />
      <span>
        Starters only
        <span className="ml-2 text-sm text-[var(--text-muted)]">
          {starterCount}
        </span>
      </span>
    </label>
  );
}

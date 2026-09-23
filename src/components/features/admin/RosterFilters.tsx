"use client";

import type { RosterFilterId } from "./roster-needs-you";

const FILTERS: { id: RosterFilterId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "no_pick", label: "No pick" },
  { id: "one_loss", label: "One loss" },
  { id: "out", label: "Out" },
];

export function RosterFilters(props: {
  value: RosterFilterId;
  counts: Record<RosterFilterId, number>;
  onChange: (id: RosterFilterId) => void;
}) {
  return (
    <div role="group" aria-label="Filter roster" className="flex flex-wrap gap-2">
      {FILTERS.map((filter) => {
        const on = props.value === filter.id;
        return (
          <button
            key={filter.id}
            type="button"
            aria-pressed={on}
            data-testid={`roster-filter-${filter.id}`}
            onClick={() => props.onChange(filter.id)}
            className={[
              "min-h-11 rounded-full border px-3 text-sm",
              on
                ? "border-gold-400 bg-gold-400/10 text-gold-400"
                : "border-stadium-border text-[var(--text-muted)]",
            ].join(" ")}
          >
            {filter.label} {props.counts[filter.id]}
          </button>
        );
      })}
    </div>
  );
}

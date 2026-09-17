import Link from "next/link";
import { ShareExport } from "@/components/ShareExport";
import type { BoardHeadingProps } from "./types";

export function BoardHeading(props: BoardHeadingProps) {
  return (
    <div
      className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3"
      data-share-chunk=""
      data-share-section="heading"
    >
      <div className="min-w-0">
        <ShareExport
          surface="board"
          rootId="share-board"
          weekLabel={props.weekLabel}
          titleRest=" · Survival board"
          stillInCount={props.stillInCount}
          undefeatedCount={props.undefeatedCount}
          eliminatedCount={props.eliminatedCount}
          pickRowCount={props.pickRowCount}
        />
        <p className="text-sm text-[var(--text-muted)] mt-1">{props.lockLine}</p>
        <p className="text-sm text-[var(--text-muted)]">{props.sortLine}</p>
      </div>
      {props.cta ? (
        <div className="flex flex-wrap gap-2 shrink-0" data-share-chrome="">
          <Link
            href={props.cta.href}
            prefetch={false}
            title={props.cta.title}
            className={
              props.cta.muted
                ? "btn-secondary text-center text-sm shrink-0 opacity-60"
                : "btn-primary text-center text-sm shrink-0"
            }
          >
            {props.cta.label}
          </Link>
        </div>
      ) : null}
    </div>
  );
}

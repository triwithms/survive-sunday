import Link from "next/link";
import { teamHref } from "./team-paths";

export function TeamBack({ abbr, name }: { abbr: string; name?: string }) {
  return (
    <div className="flex flex-wrap gap-3 text-base">
      <Link
        href={teamHref(abbr)}
        prefetch={false}
        className="text-gold-400 underline underline-offset-2"
      >
        ← {name || abbr}
      </Link>
    </div>
  );
}

import { TeamBack } from "./TeamBack";
import { TeamNewsList } from "./TeamNewsList";
import type { TeamPageData } from "./types";

export function TeamNewsScreen({ data }: { data: TeamPageData }) {
  const { news, abbr } = data;
  const empty = news.failed || news.items.length === 0;
  return (
    <div className="team-research space-y-5 min-w-0 text-base leading-relaxed">
      <TeamBack abbr={abbr} name={data.header.name} />
      <section className="card-glass p-4 space-y-3">
        <h1 className="text-xl font-semibold text-gold-400">News</h1>
        <p className="text-sm text-[var(--text-muted)] leading-relaxed">
          Headlines from ESPN&apos;s public team feed, newest first. Opens in a
          new tab.
        </p>
        {empty ? (
          <div className="space-y-2 text-base text-[var(--text-muted)]">
            <p>
              {news.failed
                ? "Couldn't load headlines right now."
                : "No headlines for this team right now."}{" "}
              Check the team pages:
            </p>
            <ul className="flex flex-wrap gap-3">
              <li>
                <a href={news.espnTeamUrl} target="_blank" rel="noopener noreferrer" className="text-gold-400 underline underline-offset-2">
                  ESPN · {abbr}
                </a>
              </li>
              <li>
                <a href={news.nflTeamUrl} target="_blank" rel="noopener noreferrer" className="text-gold-400 underline underline-offset-2">
                  NFL.com · {abbr}
                </a>
              </li>
            </ul>
          </div>
        ) : (
          <TeamNewsList items={news.items} />
        )}
      </section>
    </div>
  );
}

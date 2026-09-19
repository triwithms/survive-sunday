import { ChevronRight } from "lucide-react";
import { HELP_TOPICS } from "./topics";

export function HelpTopicMenu() {
  return (
    <nav aria-label="Help topics">
      <ul className="card-glass divide-y divide-stadium-border">
        {HELP_TOPICS.map((topic) => (
          <li key={topic.hash}>
            <a
              href={`#${topic.hash}`}
              className="flex items-center gap-2 min-h-11 py-2.5 px-4 rounded-md text-[var(--text-primary)] hover:bg-gold-400/5 active:bg-gold-400/10"
            >
              <span className="flex-1 font-medium">{topic.title}</span>
              <ChevronRight
                className="h-4 w-4 shrink-0 text-[var(--text-muted)]"
                aria-hidden
              />
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

"use client";

import { useEffect, useState } from "react";
import { HelpTopicMenu } from "@/components/features/help/HelpTopicMenu";
import { topicForHash } from "@/components/features/help/topics";

function currentHash(): string {
  if (typeof window === "undefined") return "";
  return window.location.hash.replace(/^#/, "");
}

/** Menu first. One topic after a tap or hash. Never stack every section. */
export function HelpContent() {
  const [hash, setHash] = useState("");

  useEffect(() => {
    const sync = () => setHash(currentHash());
    sync();
    window.addEventListener("hashchange", sync);
    window.addEventListener("popstate", sync);
    return () => {
      window.removeEventListener("hashchange", sync);
      window.removeEventListener("popstate", sync);
    };
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [hash]);

  const topic = topicForHash(hash);
  const Topic = topic?.Component;

  if (!Topic) {
    return (
      <article className="prose-survive text-sm leading-relaxed max-w-[68ch]">
        <HelpTopicMenu />
      </article>
    );
  }

  return (
    <article className="prose-survive space-y-6 text-sm leading-relaxed max-w-[68ch]">
      <a
        href="/help"
        className="inline-flex min-h-11 items-center text-sm text-gold-400"
        onClick={(e) => {
          e.preventDefault();
          window.history.pushState(null, "", "/help");
          setHash("");
        }}
      >
        ← Back to Help topics
      </a>
      <Topic />
    </article>
  );
}

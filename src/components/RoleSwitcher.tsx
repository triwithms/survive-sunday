"use client";

import { useState } from "react";
import type { RoleView } from "@/lib/roles";
import { DEFAULT_SIGNED_IN_PATH } from "@/lib/app-paths";

export function RoleSwitcher({
  playerName,
  activeView,
}: {
  playerName: string;
  activeView: RoleView;
}) {
  const [busy, setBusy] = useState(false);

  async function switchTo(view: RoleView) {
    if (view === activeView || busy) return;
    setBusy(true);
    try {
      await fetch("/api/account/role-view", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ view }),
      });
      window.location.assign(view === "admin" ? "/admin" : DEFAULT_SIGNED_IN_PATH);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="grid grid-cols-2 gap-1 rounded-xl border border-stadium-border bg-stadium-800 p-1"
      data-testid="role-switcher"
    >
      <button
        type="button"
        disabled={busy}
        onClick={() => void switchTo("player")}
        className={`min-h-10 rounded-lg px-2 text-xs font-semibold ${
          activeView === "player"
            ? "bg-gold-400 text-[var(--text-inverse)]"
            : "text-[var(--text-muted)]"
        }`}
        aria-pressed={activeView === "player"}
      >
        Playing as {playerName}
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => void switchTo("admin")}
        className={`min-h-10 rounded-lg px-2 text-xs font-semibold ${
          activeView === "admin"
            ? "bg-gold-400 text-[var(--text-inverse)]"
            : "text-[var(--text-muted)]"
        }`}
        aria-pressed={activeView === "admin"}
      >
        Admin tools
      </button>
    </div>
  );
}

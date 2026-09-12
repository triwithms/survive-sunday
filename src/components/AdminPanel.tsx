"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminPanel({
  weekNumber,
  members,
  games,
}: {
  weekNumber: number;
  members: { id: string; nickname: string; status: string; role: string }[];
  games: { id: string; label: string; status: string }[];
}) {
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function call(url: string, body: object) {
    setBusy(true);
    setMsg("");
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setMsg(data.error || "Failed");
      return;
    }
    setMsg(JSON.stringify(data));
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {msg && (
        <pre className="card-glass p-3 text-xs overflow-x-auto text-field-400">
          {msg}
        </pre>
      )}

      <section className="card-glass p-4 space-y-2">
        <h2 className="font-semibold">Lock controls</h2>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-secondary"
            disabled={busy}
            onClick={() =>
              call("/api/admin/lock", { weekNumber, action: "unlock" })
            }
          >
            Unlock (testing)
          </button>
          <button
            type="button"
            className="btn-secondary"
            disabled={busy}
            onClick={() =>
              call("/api/admin/lock", { weekNumber, action: "lock_now" })
            }
          >
            Lock now + missed picks
          </button>
          <button
            type="button"
            className="btn-secondary"
            disabled={busy}
            onClick={() =>
              call("/api/admin/lock", { weekNumber, action: "clear_override" })
            }
          >
            Clear override
          </button>
        </div>
      </section>

      <section className="card-glass p-4 space-y-2">
        <h2 className="font-semibold">Scores & grading</h2>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-primary"
            disabled={busy}
            onClick={() => call("/api/admin/simulate", { weekNumber })}
          >
            Simulate remaining scores
          </button>
          <button
            type="button"
            className="btn-secondary"
            disabled={busy}
            onClick={() =>
              call("/api/admin/grade", { weekNumber, applyMissed: true })
            }
          >
            Force grade + missed
          </button>
        </div>
        <p className="text-xs text-[var(--text-muted)]">
          {games.filter((g) => g.status === "final").length}/{games.length}{" "}
          games final
        </p>
      </section>

      <section className="card-glass p-4 space-y-2">
        <h2 className="font-semibold">Remove player</h2>
        <ul className="space-y-2">
          {members
            .filter((m) => m.role !== "admin")
            .map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between text-sm"
              >
                <span>
                  {m.nickname}{" "}
                  <span className="text-[var(--text-muted)]">({m.status})</span>
                </span>
                <button
                  type="button"
                  className="btn-danger text-xs px-3 py-1"
                  disabled={busy}
                  onClick={() => {
                    if (
                      confirm(`Remove ${m.nickname} from the pool?`)
                    ) {
                      call("/api/admin/remove-player", {
                        membershipId: m.id,
                      });
                    }
                  }}
                >
                  Remove
                </button>
              </li>
            ))}
        </ul>
      </section>
    </div>
  );
}

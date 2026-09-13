"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type MemberRow = {
  id: string;
  nickname: string;
  realName: string | null;
  status: string;
  role: string;
};

export function AdminPanel({
  weekNumber,
  members,
  games,
}: {
  weekNumber: number;
  members: MemberRow[];
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
            className="btn-primary"
            disabled={busy}
            onClick={() =>
              call("/api/admin/lock", { weekNumber, action: "reopen" })
            }
          >
            Reopen week for picks
          </button>
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
        <p className="text-xs text-[var(--text-muted)]">
          Reopen: sets lockAt to now+7 days, clears override +
          missedPicksAppliedAt, removes missed picks and undoes those losses.
          Real/imported picks stay.
        </p>
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
        <h2 className="font-semibold">Roster real names</h2>
        <p className="text-xs text-[var(--text-muted)]">
          Nickname stays the same. Edit the real name shown in parentheses on
          the board. Saved changes are audit-logged.
        </p>
        <ul className="space-y-3">
          {members.map((m) => (
            <RealNameRow
              key={m.id}
              member={m}
              disabled={busy}
              onBusy={setBusy}
              onMsg={setMsg}
            />
          ))}
        </ul>
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
                  {m.nickname}
                  {m.realName ? ` (${m.realName})` : ""}{" "}
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

function RealNameRow({
  member,
  disabled,
  onBusy,
  onMsg,
}: {
  member: MemberRow;
  disabled: boolean;
  onBusy: (busy: boolean) => void;
  onMsg: (msg: string) => void;
}) {
  const router = useRouter();
  const [value, setValue] = useState(member.realName ?? "");
  useEffect(() => {
    setValue(member.realName ?? "");
  }, [member.realName]);
  const saved = member.realName ?? "";
  const dirty = value.trim() !== saved;

  async function save() {
    onBusy(true);
    onMsg("");
    try {
      const res = await fetch("/api/admin/update-real-name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          membershipId: member.id,
          realName: value.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        onMsg(data.error || "Failed");
        return;
      }
      onMsg(
        `Saved ${member.nickname} → ${data.membership?.realName || "(blank)"}`
      );
      router.refresh();
    } catch {
      onMsg("Network error — try again");
    } finally {
      onBusy(false);
    }
  }

  return (
    <li className="space-y-1">
      <div className="text-sm font-medium">
        {member.nickname}{" "}
        <span className="text-[var(--text-muted)] font-normal">
          ({member.status.replace("_", " ")})
        </span>
      </div>
      <div className="flex gap-2 items-center">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={80}
          disabled={disabled}
          aria-label={`Real name for ${member.nickname}`}
          placeholder="Real name"
          className="flex-1"
          onKeyDown={(e) => {
            if (e.key === "Enter" && dirty && !disabled) {
              e.preventDefault();
              void save();
            }
          }}
        />
        <button
          type="button"
          className="btn-secondary text-xs px-3 py-1 shrink-0"
          disabled={disabled || !dirty}
          onClick={() => void save()}
        >
          Save
        </button>
      </div>
    </li>
  );
}

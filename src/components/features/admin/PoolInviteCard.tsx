"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

export function PoolInviteCard({ active }: { active: boolean }) {
  const [on, setOn] = useState(active);
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function run(action: "rotate" | "revoke") {
    setBusy(true);
    setErr("");
    setCopied(false);
    try {
      const res = await fetch("/api/admin/pool-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        url?: string;
        active?: boolean;
      };
      if (!res.ok) {
        setErr(data.error || "Could not update the link");
        setBusy(false);
        return;
      }
      setOn(Boolean(data.active));
      setUrl(typeof data.url === "string" ? data.url : "");
    } catch {
      setErr("Could not update the link");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card-glass space-y-3 p-4" data-testid="pool-invite">
      <div>
        <h2 className="font-semibold">Shared join link</h2>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Optional. One link for this pool. A player opens it and chooses
          their own email, password, and display name. Adding a player and
          texting a password still works.
        </p>
      </div>
      {on && !url ? (
        <p className="text-sm">
          A link is on. Create a new one to copy it. The previous link stops
          working.
        </p>
      ) : null}
      {url ? <p className="text-sm break-all">{url}</p> : null}
      <div className="flex flex-wrap gap-2">
        <Button type="button" pending={busy} disabled={busy} onClick={() => void run("rotate")}>
          {on ? "New link" : "Create link"}
        </Button>
        {url ? (
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            onClick={() => {
              void navigator.clipboard.writeText(url).then(() => setCopied(true));
            }}
          >
            {copied ? "Copied" : "Copy"}
          </Button>
        ) : null}
        {on ? (
          <Button type="button" variant="secondary" disabled={busy} onClick={() => void run("revoke")}>
            Turn off
          </Button>
        ) : null}
      </div>
      {err ? <p className="text-sm text-crimson-400">{err}</p> : null}
    </section>
  );
}

"use client";

import { useState } from "react";
import { Chip, Card } from "@/components/ui";
import { SignOutButton } from "@/components/SignOutButton";
import { CommissionerLoginForm } from "./CommissionerLoginForm";

export function CommissionerAccountPanel({
  currentEmail,
  isPracticeLogin,
}: {
  currentEmail: string | null;
  isPracticeLogin: boolean;
}) {
  const [email, setEmail] = useState(isPracticeLogin ? "" : currentEmail ?? "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [doneEmail, setDoneEmail] = useState("");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (password !== confirm) {
      setErr("Passwords don’t match.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/commissioner-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data.error || "Could not save login");
        return;
      }
      setDoneEmail(data.email);
      setPassword("");
      setConfirm("");
    } catch {
      setErr("Network error — try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card as="section" className="p-4 space-y-3">
      <div>
        <h2 className="font-semibold">Your administrator login</h2>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          {isPracticeLogin
            ? "This is still a practice login. Save your real email and password, sign out, then sign in with those."
            : "Administrator login is ready. Sign in on the Sign in page with this email — not a practice address."}
        </p>
      </div>
      <p className="text-sm">
        Current login:{" "}
        <span className="font-mono break-all">{currentEmail || "unknown"}</span>
        <Chip className="ml-2">
          {isPracticeLogin ? "Practice — replace this" : "Ready"}
        </Chip>
      </p>
      {doneEmail ? (
        <div className="space-y-3">
          <p className="text-sm text-field-400" role="status">
            Saved. Sign out now, then sign in with <strong>{doneEmail}</strong>.
          </p>
          <SignOutButton next="/login" className="btn-danger w-full">Sign out</SignOutButton>
        </div>
      ) : (
        <CommissionerLoginForm
          email={email}
          password={password}
          confirm={confirm}
          busy={busy}
          err={err}
          onEmail={setEmail}
          onPassword={setPassword}
          onConfirm={setConfirm}
          onSubmit={(e) => void save(e)}
        />
      )}
      {!doneEmail ? (
        <SignOutButton next="/login" className="btn-danger w-full">Sign out</SignOutButton>
      ) : null}
    </Card>
  );
}

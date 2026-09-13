"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { PhoneEditor } from "@/components/PhoneEditor";

const MAX_NICKNAME = 24;

type Props = {
  nickname: string;
  statusLabel: string;
  userId: string;
  role: string;
  phoneE164: string | null;
  phoneSoftPrompt: boolean;
};

export function NicknameEditor({
  nickname,
  statusLabel,
  userId,
  role,
  phoneE164,
  phoneSoftPrompt,
}: Props) {
  const router = useRouter();
  const dialogTitleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(nickname);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setValue(nickname);
  }, [nickname]);

  useEffect(() => {
    if (open) {
      setError("");
      setValue(nickname);
      const t = window.setTimeout(() => inputRef.current?.focus(), 50);
      return () => window.clearTimeout(t);
    }
  }, [open, nickname]);

  async function save() {
    const trimmed = value.trim();
    if (!trimmed) {
      setError("Nickname can’t be empty");
      return;
    }
    if (trimmed.length > MAX_NICKNAME) {
      setError(`Nickname must be ${MAX_NICKNAME} characters or fewer`);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/membership/nickname", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: trimmed }),
      });
      let data: { error?: string; nickname?: string } = {};
      try {
        data = await res.json();
      } catch {
        setError(`Couldn’t update nickname (HTTP ${res.status})`);
        return;
      }
      if (!res.ok) {
        setError(data.error || "Couldn’t update nickname");
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setError("Network error — try again");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="text-right text-xs min-w-0 overflow-hidden">
        <div className="flex items-center justify-end gap-1.5 min-w-0">
          <div
            className="text-[var(--text-primary)] font-medium truncate max-w-[6rem] sm:max-w-[8.5rem]"
            title={nickname}
            data-testid="session-nickname"
            data-user-id={userId}
            data-user-role={role}
          >
            {nickname}
          </div>
          <button
            type="button"
            className="shrink-0 text-[10px] sm:text-xs text-gold-400 underline underline-offset-2 hover:text-gold-500"
            onClick={() => setOpen(true)}
            data-testid="change-nickname"
            aria-label="Change nickname"
          >
            Change
          </button>
          <PhoneEditor phoneE164={phoneE164} softPrompt={phoneSoftPrompt} />
        </div>
        <div className="text-[var(--text-muted)] capitalize truncate">
          {statusLabel}
        </div>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby={dialogTitleId}
          onClick={(e) => {
            if (e.target === e.currentTarget && !busy) setOpen(false);
          }}
        >
          <div className="card-glass w-full max-w-sheet p-5 space-y-3">
            <h2 id={dialogTitleId} className="font-semibold text-lg text-gold-400">
              Change nickname
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Must be unique in this pool (case doesn’t matter). Max{" "}
              {MAX_NICKNAME} characters.
            </p>
            <label className="block text-sm">
              <span className="text-[var(--text-muted)]">Nickname</span>
              <input
                ref={inputRef}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                maxLength={MAX_NICKNAME}
                disabled={busy}
                className="mt-1 w-full"
                autoComplete="nickname"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void save();
                  }
                  if (e.key === "Escape" && !busy) setOpen(false);
                }}
              />
            </label>
            {error && (
              <p className="text-crimson-400 text-sm" role="alert">
                {error}
              </p>
            )}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                className="btn-secondary flex-1"
                disabled={busy}
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary flex-1"
                disabled={busy}
                onClick={() => void save()}
              >
                {busy ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { ModalDialog } from "@/components/ModalDialog";
import { PhoneEditor } from "@/components/PhoneEditor";
import { SignOutButton } from "@/components/SignOutButton";

const MAX_NICKNAME = 24;

const rowBtn =
  "btn-secondary w-full inline-flex items-center justify-center text-center";

type Props = {
  nickname: string;
  statusLabel: string;
  userId: string;
  role: string;
  showAdmin?: boolean;
  phoneE164: string | null;
  phoneSoftPrompt: boolean;
};

export function AccountMenu({
  nickname,
  statusLabel,
  userId,
  role,
  showAdmin,
  phoneE164,
  phoneSoftPrompt,
}: Props) {
  const router = useRouter();
  const menuTitleId = useId();
  const nickTitleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [nickOpen, setNickOpen] = useState(false);
  const [phoneOpen, setPhoneOpen] = useState(false);
  const [value, setValue] = useState(nickname);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setValue(nickname);
  }, [nickname]);

  useEffect(() => {
    if (nickOpen) {
      setError("");
      setValue(nickname);
      const t = window.setTimeout(() => inputRef.current?.focus(), 50);
      return () => window.clearTimeout(t);
    }
  }, [nickOpen, nickname]);

  async function saveNickname() {
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
      setNickOpen(false);
      router.refresh();
    } catch {
      setError("Network error — try again");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className="shrink-0 inline-flex items-center justify-center min-h-11 px-3 rounded-full border border-gold-400 text-gold-400 text-sm font-medium"
        onClick={() => setMenuOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={menuOpen}
        aria-label="Account menu — nickname, cell, notification preferences, and Sign out"
        data-testid="account-menu"
        data-user-id={userId}
        data-user-role={role}
      >
        Account
        <ChevronDown className="ml-1 h-4 w-4" aria-hidden />
      </button>

      {menuOpen && (
        <ModalDialog
          labelledBy={menuTitleId}
          placement="sheet"
          onBackdropClick={() => setMenuOpen(false)}
        >
          <h2 id={menuTitleId} className="font-semibold text-lg text-gold-400">
            Account
          </h2>
          <div>
            <p
              className="text-lg font-medium text-[var(--text-primary)] break-words"
              data-testid="session-nickname"
            >
              {nickname}
            </p>
            <p className="text-sm text-[var(--text-muted)] capitalize mt-0.5">
              {statusLabel}
            </p>
          </div>
          <SignOutButton next="/login" className="btn-danger w-full" />
          {(showAdmin ?? role === "admin") && (
            <Link
              href="/admin#pool-mode"
              prefetch={false}
              className={rowBtn}
              onClick={() => setMenuOpen(false)}
            >
              Admin
            </Link>
          )}
          <button
            type="button"
            className={rowBtn}
            onClick={() => {
              setMenuOpen(false);
              setNickOpen(true);
            }}
            data-testid="change-nickname"
          >
            Change nickname
          </button>
          <button
            type="button"
            className={rowBtn}
            onClick={() => {
              setMenuOpen(false);
              setPhoneOpen(true);
            }}
            data-testid="change-phone"
          >
            {phoneE164 ? "Edit cell number" : "Add cell number"}
          </button>
          <Link
            href="/account/notifications"
            prefetch={false}
            className={rowBtn}
            onClick={() => setMenuOpen(false)}
            data-testid="notification-prefs"
          >
            Notification preferences
          </Link>
          <button
            type="button"
            className={rowBtn}
            onClick={() => setMenuOpen(false)}
          >
            Close
          </button>
        </ModalDialog>
      )}

      {nickOpen && (
        <ModalDialog
          labelledBy={nickTitleId}
          placement="sheet"
          onBackdropClick={busy ? undefined : () => setNickOpen(false)}
        >
          <h2 id={nickTitleId} className="font-semibold text-lg text-gold-400">
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
                  void saveNickname();
                }
                if (e.key === "Escape" && !busy) setNickOpen(false);
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
              onClick={() => setNickOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary flex-1"
              disabled={busy}
              onClick={() => void saveNickname()}
            >
              {busy ? "Saving…" : "Save"}
            </button>
          </div>
        </ModalDialog>
      )}

      <PhoneEditor
        phoneE164={phoneE164}
        softPrompt={phoneSoftPrompt}
        hideTrigger
        open={phoneOpen}
        onOpenChange={setPhoneOpen}
      />
    </>
  );
}

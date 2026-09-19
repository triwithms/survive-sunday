"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { ModalDialog } from "@/components/ModalDialog";
import { formatPhoneDisplay } from "@/lib/phone";

type Props = {
  phoneE164: string | null;
  /** Soft prompt when never set and never skipped */
  softPrompt: boolean;
  hideTrigger?: boolean;
  triggerClassName?: string;
  /** Open the edit dialog from Account (not the first-run soft prompt). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function PhoneEditor({
  phoneE164,
  softPrompt,
  hideTrigger = false,
  triggerClassName,
  open: openProp,
  onOpenChange,
}: Props) {
  const router = useRouter();
  const dialogTitleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [softOpen, setSoftOpen] = useState(softPrompt);
  const [value, setValue] = useState(
    phoneE164 ? formatPhoneDisplay(phoneE164) : ""
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setValue(phoneE164 ? formatPhoneDisplay(phoneE164) : "");
  }, [phoneE164]);

  useEffect(() => {
    setSoftOpen(softPrompt);
  }, [softPrompt]);

  useEffect(() => {
    if (openProp) {
      setSoftOpen(false);
      setOpen(true);
    } else if (openProp === false) {
      setOpen(false);
    }
  }, [openProp]);

  useEffect(() => {
    if (open || softOpen) {
      setError("");
      setValue(phoneE164 ? formatPhoneDisplay(phoneE164) : "");
      const t = window.setTimeout(() => inputRef.current?.focus(), 50);
      return () => window.clearTimeout(t);
    }
  }, [open, softOpen, phoneE164]);

  async function save() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/user/phone", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: value.trim() }),
      });
      let data: { error?: string; phoneE164?: string } = {};
      try {
        data = await res.json();
      } catch {
        setError(`Couldn’t save number (HTTP ${res.status})`);
        return;
      }
      if (!res.ok) {
        setError(data.error || "Couldn’t save number");
        return;
      }
      setOpen(false);
      setSoftOpen(false);
      onOpenChange?.(false);
      router.refresh();
    } catch {
      setError("Network error — try again");
    } finally {
      setBusy(false);
    }
  }

  async function skip() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/user/phone", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skip: true }),
      });
      let data: { error?: string } = {};
      try {
        data = await res.json();
      } catch {
        setError(`Couldn’t dismiss (HTTP ${res.status})`);
        return;
      }
      if (!res.ok) {
        setError(data.error || "Couldn’t dismiss");
        return;
      }
      setSoftOpen(false);
      onOpenChange?.(false);
      router.refresh();
    } catch {
      setError("Network error — try again");
    } finally {
      setBusy(false);
    }
  }

  const dialogOpen = open || softOpen;
  const isSoft = softOpen && !open;

  return (
    <>
      {!hideTrigger && (
        <button
          type="button"
          className={
            triggerClassName ??
            "shrink-0 text-[10px] sm:text-xs text-gold-400 underline underline-offset-2 hover:text-gold-500 min-h-11"
          }
          onClick={() => {
            setSoftOpen(false);
            setOpen(true);
            onOpenChange?.(true);
          }}
          data-testid="change-phone"
          aria-label={phoneE164 ? "Change cell number" : "Add cell number"}
        >
          {phoneE164 ? "Cell" : "Add cell"}
        </button>
      )}

      {dialogOpen && (
        <ModalDialog
          labelledBy={dialogTitleId}
          onBackdropClick={
            busy || isSoft
              ? undefined
              : () => {
                  setOpen(false);
                  onOpenChange?.(false);
                }
          }
        >
          <h2
            id={dialogTitleId}
            className="font-semibold text-lg text-gold-400"
          >
            {isSoft
              ? "Add your cell for SMS reminders"
              : phoneE164
                ? "Change cell number"
                : "Add cell number"}
          </h2>
          <p className="text-xs text-[var(--text-muted)]">
            {isSoft ? (
              <>
                We’ll text you if you’re missing a pick before lock — unless you
                turn that reminder off under Account → Notification
                preferences. SMS only for now — WhatsApp later. You can add or
                change this later from Account or the header.
              </>
            ) : (
              <>
                Used for missing-pick SMS if that type is Email, SMS, or both
                under Account → Notification preferences. Canadian and
                US numbers welcome — e.g. (416) 951-4262 or +1…
              </>
            )}
          </p>
          <label className="block text-sm">
            <span className="text-[var(--text-muted)]">Cell number</span>
            <input
              ref={inputRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              disabled={busy}
              className="mt-1 w-full"
              autoComplete="tel"
              inputMode="tel"
              placeholder="(416) 951-4262"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void save();
                }
                if (e.key === "Escape" && !busy && !isSoft) {
                  setOpen(false);
                  onOpenChange?.(false);
                }
              }}
            />
          </label>
          {error && (
            <p className="text-crimson-400 text-sm" role="alert">
              {error}
            </p>
          )}
          <div className="flex gap-2 pt-1">
            {isSoft ? (
              <button
                type="button"
                className="btn-secondary flex-1"
                disabled={busy}
                onClick={() => void skip()}
                data-testid="skip-phone"
              >
                {busy ? "…" : "Not now"}
              </button>
            ) : (
              <button
                type="button"
                className="btn-secondary flex-1"
                disabled={busy}
                onClick={() => {
                  setOpen(false);
                  onOpenChange?.(false);
                }}
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              className="btn-primary flex-1"
              disabled={busy}
              onClick={() => void save()}
              data-testid="save-phone"
            >
              {busy ? "Saving…" : "Save"}
            </button>
          </div>
        </ModalDialog>
      )}
    </>
  );
}

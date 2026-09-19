"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ModalDialog } from "@/components/ModalDialog";
import { Button } from "@/components/ui";
import { ACCOUNT_ROW } from "./account-row";
import { MAX_NICKNAME, useNicknameEdit } from "./use-nickname-edit";

export function AccountNicknameSheet({ nickname }: { nickname: string }) {
  const titleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const edit = useNicknameEdit(nickname);
  const { setError, setValue } = edit;

  useEffect(() => {
    if (!open) return;
    setError("");
    setValue(nickname);
    const t = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, [open, nickname, setError, setValue]);

  return (
    <>
      <button
        type="button"
        className={ACCOUNT_ROW}
        onClick={() => setOpen(true)}
        data-testid="change-nickname"
      >
        Change nickname
      </button>
      {open ? (
        <ModalDialog
          labelledBy={titleId}
          placement="sheet"
          onBackdropClick={edit.busy ? undefined : () => setOpen(false)}
        >
          <h2 id={titleId} className="font-semibold text-lg text-gold-400">
            Change nickname
          </h2>
          <p className="text-xs text-[var(--text-muted)]">
            Must be unique in this pool (case doesn’t matter). Max {MAX_NICKNAME}{" "}
            characters.
          </p>
          <label className="block text-sm">
            <span className="text-[var(--text-muted)]">Nickname</span>
            <input
              ref={inputRef}
              value={edit.value}
              onChange={(e) => edit.setValue(e.target.value)}
              maxLength={MAX_NICKNAME}
              disabled={edit.busy}
              className="mt-1 w-full"
              autoComplete="nickname"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void edit.save().then((ok) => ok && setOpen(false));
                }
                if (e.key === "Escape" && !edit.busy) setOpen(false);
              }}
            />
          </label>
          {edit.error ? (
            <p className="text-crimson-400 text-sm" role="alert">
              {edit.error}
            </p>
          ) : null}
          <div className="flex gap-2 pt-1">
            <Button
              variant="secondary"
              className="flex-1"
              disabled={edit.busy}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              disabled={edit.busy}
              onClick={() => void edit.save().then((ok) => ok && setOpen(false))}
            >
              {edit.busy ? "Saving…" : "Save"}
            </Button>
          </div>
        </ModalDialog>
      ) : null}
    </>
  );
}

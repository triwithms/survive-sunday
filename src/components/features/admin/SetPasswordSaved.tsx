"use client";

import { Button } from "@/components/ui";
import { memberPasswordShareText, type PasswordKind } from "./password-members";

export function SetPasswordSaved({
  nickname,
  email,
  emailMasked,
  password,
  kind,
  onAnother,
}: {
  nickname: string;
  email: string;
  emailMasked: string;
  password: string;
  kind: PasswordKind;
  onAnother: () => void;
}) {
  const text = memberPasswordShareText({ email, password, kind });
  return (
    <div className="space-y-3">
      <p className="text-sm text-field-400" role="status">
        Saved for <strong>{nickname}</strong> ({emailMasked}). Copy this and
        text it — email, password, and the Sign in link.
      </p>
      <textarea
        readOnly
        rows={8}
        className="w-full font-mono text-sm"
        value={text}
        aria-label="Text to send"
      />
      <Button
        variant="secondary"
        className="w-full"
        onClick={() => {
          void navigator.clipboard.writeText(text).catch(() => {});
        }}
      >
        Copy text to send
      </Button>
      <Button className="w-full" onClick={onAnother}>
        Set another
      </Button>
    </div>
  );
}

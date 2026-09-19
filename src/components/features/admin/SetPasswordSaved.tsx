"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { copyText } from "./copy-join";
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
  const [copied, setCopied] = useState(false);
  return (
    <div className="space-y-3">
      <p className="text-sm text-field-400" role="status">
        Saved for <strong>{nickname}</strong> ({emailMasked}). Copy this and
        text it — email, password, and the Sign in link. We do not email it.
      </p>
      <textarea
        readOnly
        rows={12}
        className="w-full font-mono text-sm min-h-[12rem] break-words"
        value={text}
        aria-label="Text to send"
      />
      <Button
        variant="secondary"
        className="w-full min-h-11"
        onClick={() => {
          void copyText(text).then((ok) => {
            setCopied(ok);
            window.setTimeout(() => setCopied(false), 2200);
          });
        }}
      >
        {copied ? "Copied" : "Copy text to send"}
      </Button>
      <Button className="w-full min-h-11" onClick={onAnother}>
        Set another
      </Button>
    </div>
  );
}

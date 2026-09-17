"use client";

import { Button } from "@/components/ui";

export function SetPasswordSaved({
  nickname,
  emailMasked,
  password,
  onCopy,
  onAnother,
}: {
  nickname: string;
  emailMasked: string;
  password: string;
  onCopy: () => void;
  onAnother: () => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-field-400" role="status">
        Saved for <strong>{nickname}</strong> ({emailMasked}). Text them this
        password, then they open Sign in → <strong>Use password instead</strong>.
      </p>
      <p className="font-mono text-lg text-gold-400 break-all card-glass p-3">
        {password}
      </p>
      <Button variant="secondary" className="w-full" onClick={onCopy}>
        Copy password
      </Button>
      <Button className="w-full" onClick={onAnother}>
        Set another
      </Button>
    </div>
  );
}

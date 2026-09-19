"use client";

import { useState } from "react";
import { PhoneEditor } from "@/components/PhoneEditor";
import { ACCOUNT_ROW } from "./account-row";

export function AccountPhoneRow({ phoneE164 }: { phoneE164: string | null }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className={ACCOUNT_ROW}
        onClick={() => setOpen(true)}
        data-testid="change-phone"
      >
        {phoneE164 ? "Edit cell number" : "Add cell number"}
      </button>
      <PhoneEditor
        phoneE164={phoneE164}
        softPrompt={false}
        hideTrigger
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function useInstallPrompt() {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    function onBip(e: Event) {
      e.preventDefault();
      setEvent(e as BeforeInstallPromptEvent);
    }
    window.addEventListener("beforeinstallprompt", onBip);
    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  const promptInstall = useCallback(async () => {
    if (!event) return "unavailable" as const;
    try {
      await event.prompt();
      const { outcome } = await event.userChoice;
      setEvent(null);
      return outcome;
    } catch {
      return "dismissed" as const;
    }
  }, [event]);

  return { canPrompt: Boolean(event), promptInstall };
}

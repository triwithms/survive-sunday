"use client";

import { useCallback, useEffect, useState } from "react";
import { A2hsCard } from "./A2hsCard";
import {
  markInstalled,
  optOutA2hs,
  snoozeA2hs,
  subscribeA2hsOpen,
} from "./actions";
import {
  a2hsVariant,
  clientUa,
  isMobile,
  isStandalone,
  type A2hsVariant,
} from "./env";
import { readA2hsState, shouldShowA2hs } from "./state";
import { useInstallPrompt } from "./useInstallPrompt";

export function A2hsNudge() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [variant, setVariant] = useState<A2hsVariant>("ios");
  const { canPrompt, promptInstall } = useInstallPrompt();

  const refresh = useCallback(() => {
    if (isStandalone()) {
      markInstalled();
      setOpen(false);
      return;
    }
    const { ua, touch } = clientUa();
    setVariant(a2hsVariant(ua, touch));
    const rec = readA2hsState();
    setOpen(
      shouldShowA2hs({
        mobile: isMobile(ua, touch),
        standalone: false,
        ...rec,
      })
    );
  }, []);

  useEffect(() => {
    refresh();
    const off = subscribeA2hsOpen(refresh);
    window.addEventListener("appinstalled", markInstalled);
    return () => {
      off();
      window.removeEventListener("appinstalled", markInstalled);
    };
  }, [refresh]);

  if (!open) return null;

  return (
    <A2hsCard
      variant={variant}
      canPrompt={canPrompt}
      copied={copied}
      onInstall={() => {
        void promptInstall().then((out) => {
          if (out === "accepted") {
            markInstalled();
            setOpen(false);
          }
        });
      }}
      onCopy={() => {
        void navigator.clipboard
          .writeText(location.href)
          .then(() => setCopied(true), () => undefined);
      }}
      onAdded={() => {
        markInstalled();
        setOpen(false);
      }}
      onLater={() => {
        snoozeA2hs();
        setOpen(false);
      }}
      onOptOut={() => {
        optOutA2hs();
        setOpen(false);
      }}
    />
  );
}

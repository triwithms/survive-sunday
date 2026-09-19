"use client";

import { useCallback, useEffect, useState } from "react";
import { A2hsCard } from "./A2hsCard";
import { markInstalled, markNotNow, optOutA2hs, subscribeA2hsOpen } from "./actions";
import {
  a2hsVariant,
  clientUa,
  isMobile,
  isStandalone,
  type A2hsVariant,
} from "./env";
import { readA2hsState, reconcileA2hs, shouldShowA2hs, writeA2hsState } from "./state";
import { useInstallPrompt } from "./useInstallPrompt";

export function A2hsNudge() {
  const [open, setOpen] = useState(false);
  const [yesMode, setYesMode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [variant, setVariant] = useState<A2hsVariant>("ios");
  const { canPrompt, promptInstall } = useInstallPrompt();

  const refresh = useCallback((startYes = false) => {
    const standalone = isStandalone();
    const rec = reconcileA2hs(readA2hsState(), standalone);
    writeA2hsState(rec);
    if (standalone) {
      setOpen(false);
      setYesMode(false);
      return;
    }
    const { ua, touch } = clientUa();
    const mobile = isMobile(ua, touch);
    setVariant(a2hsVariant(ua, touch));
    const show = shouldShowA2hs({ mobile, standalone: false, status: rec.status });
    setOpen(show || (startYes && mobile));
    setYesMode(Boolean(startYes && mobile));
  }, []);

  const onYes = () => {
    if (!canPrompt) {
      setYesMode(true);
      return;
    }
    void promptInstall().then((out) => {
      if (out === "accepted") {
        markInstalled();
        setOpen(false);
        setYesMode(false);
      }
    });
  };

  useEffect(() => {
    refresh();
    const off = subscribeA2hsOpen((yes) => refresh(yes));
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
      yesMode={yesMode}
      onYes={onYes}
      onNo={() => {
        optOutA2hs();
        setOpen(false);
      }}
      onNotNow={() => {
        markNotNow();
        setOpen(false);
      }}
      onInstall={onYes}
      onCopy={() => {
        void navigator.clipboard
          .writeText(location.href)
          .then(() => setCopied(true), () => undefined);
      }}
    />
  );
}

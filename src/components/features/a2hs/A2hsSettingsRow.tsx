"use client";

import { useEffect, useState } from "react";
import { isStandalone } from "./env";
import { reopenA2hsNudge } from "./actions";

export function A2hsSettingsRow({
  className,
  onOpened,
}: {
  className?: string;
  onOpened?: () => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(!isStandalone());
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      className={className}
      data-testid="a2hs-settings"
      onClick={() => {
        reopenA2hsNudge();
        onOpened?.();
      }}
    >
      Add to Home Screen
    </button>
  );
}

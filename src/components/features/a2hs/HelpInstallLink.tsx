"use client";

import { reopenA2hsNudge } from "./actions";

export function HelpInstallLink() {
  return (
    <a
      href="#install-home-screen"
      className="text-gold-400 underline underline-offset-2 min-h-12 inline-flex items-center text-base"
      onClick={() => reopenA2hsNudge(true)}
    >
      Install on Home Screen
    </a>
  );
}

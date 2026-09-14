"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ModalDialog } from "@/components/ModalDialog";
import {
  decideAddToHomePrompt,
  detectAndroid,
  detectIos,
  dismissAddToHomePermanently,
  isMobileBrowser,
  isStandaloneDisplay,
  markStandaloneGreeted,
  readAthStorage,
  snoozeAddToHome,
} from "@/lib/pwa-install";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function AddToHomeScreenPrompt() {
  const [decision, setDecision] = useState<"hide" | "good" | "ask">("hide");
  const [how, setHow] = useState(false);
  const [ios, setIos] = useState(false);
  const [android, setAndroid] = useState(false);
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(
    null
  );

  useEffect(() => {
    function refresh() {
      const ua = navigator.userAgent;
      const touch = navigator.maxTouchPoints || 0;
      const stored = readAthStorage();
      setIos(detectIos(ua, touch));
      setAndroid(detectAndroid(ua));
      setDecision(
        decideAddToHomePrompt({
          standalone: isStandaloneDisplay(window),
          mobile: isMobileBrowser(ua, touch),
          ...stored,
        })
      );
    }
    refresh();

    function onBip(e: Event) {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    }
    window.addEventListener("beforeinstallprompt", onBip);
    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  if (decision === "hide") return null;

  if (decision === "good") {
    return (
      <ModalDialog labelledBy="ath-good-title" placement="sheet">
        <h2 id="ath-good-title" className="font-display text-xl text-gold-400">
          You’re good
        </h2>
        <p className="text-sm text-[var(--text-muted)]">
          You’re using the Home Screen icon. Stay signed in — we won’t keep
          asking.
        </p>
        <button
          type="button"
          className="btn-primary w-full"
          onClick={() => {
            markStandaloneGreeted();
            setDecision("hide");
          }}
        >
          Got it
        </button>
      </ModalDialog>
    );
  }

  return (
    <ModalDialog labelledBy="ath-ask-title" placement="sheet">
      <h2 id="ath-ask-title" className="font-display text-xl text-gold-400">
        {how ? "Add to Home Screen" : "Home Screen"}
      </h2>
      {!how ? (
        <>
          <p className="text-sm text-[var(--text-muted)]">
            Add Survive Sunday to your Home Screen? Stay signed in on this
            phone.
          </p>
          <button
            type="button"
            className="btn-primary w-full"
            onClick={() => {
              dismissAddToHomePermanently();
              setDecision("hide");
            }}
          >
            Yes
          </button>
          <button
            type="button"
            className="btn-secondary w-full"
            onClick={() => setHow(true)}
          >
            Show me how
          </button>
          <button
            type="button"
            className="w-full text-sm text-[var(--text-muted)] underline underline-offset-2 min-h-11"
            onClick={() => {
              snoozeAddToHome();
              setDecision("hide");
            }}
          >
            Not now
          </button>
        </>
      ) : (
        <>
          {ios && (
            <ol className="list-decimal pl-5 space-y-2 text-sm text-[var(--text-muted)]">
              <li>
                Stay in <strong className="text-[var(--text-primary)]">Safari</strong>{" "}
                (not Chrome, and not the in-app browser inside Messages).
              </li>
              <li>
                Tap the <strong className="text-[var(--text-primary)]">Share</strong>{" "}
                button (square with an arrow pointing up).
              </li>
              <li>
                Scroll and tap{" "}
                <strong className="text-[var(--text-primary)]">Add to Home Screen</strong>,
                then <strong className="text-[var(--text-primary)]">Add</strong>.
              </li>
              <li>Open the new Survive Sunday icon — you stay signed in.</li>
            </ol>
          )}
          {android && (
            <ol className="list-decimal pl-5 space-y-2 text-sm text-[var(--text-muted)]">
              <li>
                Stay in <strong className="text-[var(--text-primary)]">Chrome</strong>.
              </li>
              <li>
                Tap the three dots, then{" "}
                <strong className="text-[var(--text-primary)]">Install app</strong> or{" "}
                <strong className="text-[var(--text-primary)]">Add to Home screen</strong>.
              </li>
              <li>Open the new icon. You stay signed in on this phone.</li>
            </ol>
          )}
          {!ios && !android && (
            <p className="text-sm text-[var(--text-muted)]">
              On a computer, bookmark the site. The Home Screen steps are for
              phones.
            </p>
          )}
          {android && installEvent && (
            <button
              type="button"
              className="btn-primary w-full"
              onClick={async () => {
                try {
                  await installEvent.prompt();
                  const choice = await installEvent.userChoice;
                  if (choice.outcome === "accepted") {
                    dismissAddToHomePermanently();
                    setDecision("hide");
                  }
                } catch {
                  /* user cancelled */
                }
              }}
            >
              Install now
            </button>
          )}
          <p className="text-xs text-[var(--text-muted)]">
            Stuck? See{" "}
            <Link href="/help#11-install-the-app-pwa" className="text-gold-400">
              Help — Install the app
            </Link>{" "}
            and troubleshooting.
          </p>
          <button
            type="button"
            className="btn-secondary w-full"
            onClick={() => {
              dismissAddToHomePermanently();
              setDecision("hide");
            }}
          >
            Done — don’t ask again
          </button>
          <button
            type="button"
            className="w-full text-sm text-[var(--text-muted)] underline underline-offset-2 min-h-11"
            onClick={() => {
              snoozeAddToHome();
              setDecision("hide");
            }}
          >
            Not now
          </button>
        </>
      )}
    </ModalDialog>
  );
}

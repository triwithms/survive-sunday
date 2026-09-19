"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { ModalDialog } from "@/components/ModalDialog";
import {
  canSharePictures,
  captureSharePictures,
  downloadPicture,
  sharePictures,
  type SharePicture,
} from "@/lib/share-capture";
import {
  alwaysIncludesFull,
  isComfortablyLong,
  isTripleTap,
  recordTapTimes,
  shareCaption,
  shareOptionsFor,
  SHARE_LONG_PRESS_MS,
  SHARE_OPEN_EVENT,
  type ShareOptionId,
  type ShareSurface,
} from "@/lib/share-export";

export type ShareExportProps = {
  surface: ShareSurface;
  rootId: string;
  weekLabel: string;
  /** Text after the week label in the page title, e.g. " · Leaderboard". */
  titleRest: string;
  /** Leaderboard is a season race — hide week words in the page title. */
  showWeekInTitle?: boolean;
  stillInCount?: number;
  undefeatedCount?: number;
  eliminatedCount?: number;
  gameCount?: number;
  liveGameCount?: number;
  pickRowCount?: number;
};

export function ShareExport({
  surface,
  rootId,
  weekLabel,
  titleRest,
  showWeekInTitle = true,
  stillInCount = 0,
  undefeatedCount = 0,
  eliminatedCount = 0,
  gameCount = 0,
  liveGameCount = 0,
  pickRowCount = 0,
}: ShareExportProps) {
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [option, setOption] = useState<ShareOptionId>("full");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pictures, setPictures] = useState<SharePicture[]>([]);
  const [tooLong, setTooLong] = useState(false);
  const holdTimer = useRef<number | null>(null);
  const taps = useRef<number[]>([]);

  const options = useMemo(
    () =>
      shareOptionsFor({
        surface,
        stillInCount,
        undefeatedCount,
        eliminatedCount,
        gameCount,
        liveGameCount,
        pickRowCount,
        tooLong,
      }),
    [
      surface,
      stillInCount,
      undefeatedCount,
      eliminatedCount,
      gameCount,
      liveGameCount,
      pickRowCount,
      tooLong,
    ]
  );

  const label = surface === "board" ? "Leaderboard" : "Scores";

  function measureTooLong() {
    const root = document.getElementById(rootId);
    const height = root
      ? Math.max(root.scrollHeight, root.offsetHeight)
      : 0;
    setTooLong(isComfortablyLong(height));
  }

  function openSheet() {
    measureTooLong();
    setOpen(true);
  }

  function close() {
    setOpen(false);
    setBusy(false);
    setError(null);
    setPictures([]);
    setOption("full");
  }

  function clearHold() {
    if (holdTimer.current != null) {
      window.clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  }

  function onTitlePointerDown(e: ReactPointerEvent) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    clearHold();
    holdTimer.current = window.setTimeout(() => {
      holdTimer.current = null;
      openSheet();
    }, SHARE_LONG_PRESS_MS);
  }

  function onWeekTap() {
    taps.current = recordTapTimes(taps.current, Date.now());
    if (isTripleTap(taps.current)) {
      taps.current = [];
      openSheet();
    }
  }

  useEffect(() => {
    function onQuietOpen() {
      openSheet();
    }
    window.addEventListener(SHARE_OPEN_EVENT, onQuietOpen);
    return () => window.removeEventListener(SHARE_OPEN_EVENT, onQuietOpen);
    // openSheet reads latest root height at click time
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rootId]);

  useEffect(() => () => clearHold(), []);

  async function makePictures(next = option) {
    const root = document.getElementById(rootId);
    if (!root) {
      setError("Couldn’t find the page to copy. Pull to refresh and try again.");
      return;
    }
    setBusy(true);
    setError(null);
    setPictures([]);
    try {
      const made = await captureSharePictures({
        root,
        surface,
        weekLabel,
        option: next,
      });
      if (!made.length) {
        setError("Couldn’t make the picture. Try a shorter option.");
        return;
      }
      setPictures(made);
    } catch {
      setError(
        "Couldn’t make the picture on this phone. Try a shorter option, or take a regular screenshot."
      );
    } finally {
      setBusy(false);
    }
  }

  const canSend = pictures.length > 0 && canSharePictures(pictures);
  const caption = shareCaption(surface, weekLabel, option);

  return (
    <>
      <h1
        className="font-display text-2xl text-gold-400 tracking-wide select-none"
        data-testid="share-export-title"
        aria-label={`${showWeekInTitle ? `${weekLabel}${titleRest}` : titleRest}. Press and hold to share as a picture.`}
        onPointerDown={onTitlePointerDown}
        onPointerUp={clearHold}
        onPointerCancel={clearHold}
        onPointerLeave={clearHold}
        onContextMenu={(e) => e.preventDefault()}
      >
        {showWeekInTitle ? (
          <span
            role="button"
            tabIndex={0}
            className="cursor-default"
            data-testid="share-export-week"
            onClick={(e) => {
              e.stopPropagation();
              onWeekTap();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onWeekTap();
              }
            }}
          >
            {weekLabel}
          </span>
        ) : null}
        {titleRest}
      </h1>
      <button
        type="button"
        className="sr-only"
        data-testid="share-export-open"
        onClick={openSheet}
      >
        Share {label} as a picture
      </button>

      {open ? (
        <ModalDialog
          labelledBy={titleId}
          placement="sheet"
          onBackdropClick={busy ? undefined : close}
        >
          <h2
            id={titleId}
            className="font-display text-xl text-gold-400 tracking-wide"
          >
            Share {label} as a picture
          </h2>
          <p className="text-sm text-[var(--text-muted)]">
            Pick what to include, then save it or send it to the group text.
            The full long picture is always available.
          </p>

          <fieldset className="space-y-2" disabled={busy}>
            <legend className="sr-only">What to include</legend>
            {options.map((item) => (
              <label
                key={item.id}
                className={`flex items-start gap-3 rounded-xl border px-3 py-3 min-h-11 ${
                  option === item.id
                    ? "border-gold-400/70 bg-gold-400/5"
                    : "border-stadium-border"
                }`}
              >
                <input
                  type="radio"
                  name="share-option"
                  className="mt-1 shrink-0"
                  checked={option === item.id}
                  onChange={() => {
                    setOption(item.id);
                    setPictures([]);
                    setError(null);
                  }}
                />
                <span className="min-w-0">
                  <span className="block font-medium text-[var(--text-primary)]">
                    {item.title}
                    {item.always ? (
                      <span className="ml-2 text-[10px] uppercase tracking-wide text-gold-400">
                        Always
                      </span>
                    ) : null}
                  </span>
                  <span className="block text-xs text-[var(--text-muted)] mt-0.5">
                    {item.detail}
                  </span>
                </span>
              </label>
            ))}
          </fieldset>

          {tooLong && option === "full" ? (
            <p className="text-xs text-[var(--text-muted)]">
              This page is long. You can still make one tall picture, or pick
              “A few shorter pictures” if that’s easier to send.
            </p>
          ) : null}

          {error ? (
            <p className="text-sm text-crimson-400" role="alert">
              {error}
            </p>
          ) : null}

          {pictures.length > 0 ? (
            <div className="space-y-3" data-testid="share-export-preview">
              <p className="text-xs text-[var(--text-muted)]">
                {pictures.length === 1
                  ? "Preview — save or send this picture."
                  : `${pictures.length} pictures. Save or send each one (or all at once if your phone allows).`}
              </p>
              {pictures.map((pic) => (
                <figure key={pic.filename} className="space-y-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={pic.dataUrl}
                    alt={pic.filename}
                    className="w-full rounded-lg border border-stadium-border"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="btn-secondary text-xs px-3 py-2 min-h-11"
                      onClick={() => downloadPicture(pic)}
                    >
                      Save this picture
                    </button>
                    {canSharePictures([pic]) ? (
                      <button
                        type="button"
                        className="btn-secondary text-xs px-3 py-2 min-h-11"
                        onClick={() => void sharePictures([pic], caption)}
                      >
                        Send this one
                      </button>
                    ) : null}
                  </div>
                </figure>
              ))}
            </div>
          ) : null}

          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <button
              type="button"
              className="btn-primary w-full sm:w-auto"
              disabled={busy}
              onClick={() => void makePictures()}
            >
              {busy ? "Making the picture…" : pictures.length ? "Make again" : "Make picture"}
            </button>
            {pictures.length > 0 ? (
              <button
                type="button"
                className="btn-secondary w-full sm:w-auto"
                onClick={() => pictures.forEach(downloadPicture)}
              >
                {pictures.length > 1 ? "Save all" : "Save image"}
              </button>
            ) : null}
            {canSend ? (
              <button
                type="button"
                className="btn-secondary w-full sm:w-auto"
                onClick={() => void sharePictures(pictures, caption)}
              >
                Send…
              </button>
            ) : null}
            <button
              type="button"
              className="btn-secondary w-full sm:w-auto"
              disabled={busy}
              onClick={close}
            >
              Close
            </button>
          </div>

          {!alwaysIncludesFull(options) ? (
            <p className="text-xs text-crimson-400">
              Full long picture should always be listed. Refresh the page.
            </p>
          ) : null}
        </ModalDialog>
      ) : null}
    </>
  );
}

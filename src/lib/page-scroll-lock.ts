"use client";

import { useEffect } from "react";

/** The element that scrolls the page: the app pane on touch screens, else null (document). */
export function appScrollPane(): HTMLElement | null {
  const pane = document.querySelector<HTMLElement>("[data-app-main]");
  return pane && getComputedStyle(pane).overflowY === "auto" ? pane : null;
}

let locks = 0;
let saved: {
  pane: HTMLElement | null;
  paneTop: number;
  paneOverflow: string;
  windowY: number;
  bodyOverflow: string;
} | null = null;

/**
 * Freeze the page behind a popup. Returns the unlock, which puts the page
 * back where it was (iOS can drift the offset while overflow is hidden).
 * Nested popups share one lock.
 */
export function lockPageScroll(): () => void {
  if (locks++ === 0) {
    const pane = appScrollPane();
    saved = {
      pane,
      paneTop: pane?.scrollTop ?? 0,
      paneOverflow: pane?.style.overflowY ?? "",
      windowY: window.scrollY,
      bodyOverflow: document.body.style.overflow,
    };
    document.body.style.overflow = "hidden";
    if (pane) pane.style.overflowY = "hidden";
  }
  let released = false;
  return () => {
    if (released) return;
    released = true;
    if (--locks > 0 || !saved) return;
    const s = saved;
    saved = null;
    document.body.style.overflow = s.bodyOverflow;
    if (s.pane) {
      s.pane.style.overflowY = s.paneOverflow;
      s.pane.scrollTop = s.paneTop;
    }
    window.scrollTo(0, s.windowY);
  };
}

export function usePageScrollLock() {
  useEffect(() => lockPageScroll(), []);
}

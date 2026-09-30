"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { appScrollPane } from "@/lib/page-scroll-lock";

const VARS = [
  ["[data-app-header]", "--app-header-h"],
  ["[data-app-nav]", "--app-nav-h"],
] as const;

/**
 * When the document scrolls (mouse/trackpad), the sticky header / bottom nav
 * overlap page content. Publish their heights for scroll-padding and in-page
 * sticky bars (header height changes with safe area, zoom and the rules banner).
 */
export function ChromeInsets() {
  const path = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    const sync = () => {
      for (const [selector, name] of VARS) {
        const el = document.querySelector<HTMLElement>(selector);
        root.style.setProperty(name, `${el?.offsetHeight ?? 0}px`);
      }
    };
    const observer = new ResizeObserver(sync);
    for (const [selector] of VARS) {
      const el = document.querySelector(selector);
      if (el) observer.observe(el);
    }
    sync();
    return () => {
      observer.disconnect();
      for (const [, name] of VARS) root.style.removeProperty(name);
    };
  }, []);

  // Next only scrollIntoView()s the new page inside the touch-screen pane,
  // which stops below the pane's top padding. Start each tab at the top.
  useEffect(() => {
    if (!window.location.hash) appScrollPane()?.scrollTo(0, 0);
  }, [path]);

  return null;
}

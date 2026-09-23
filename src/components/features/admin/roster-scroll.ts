export function nearestScroller(node: HTMLElement | null): HTMLElement | null {
  let parent = node?.parentElement ?? null;
  while (parent) {
    const oy = getComputedStyle(parent).overflowY;
    if (oy === "auto" || oy === "scroll") return parent;
    parent = parent.parentElement;
  }
  return null;
}

export function readRosterScroll(node: HTMLElement | null): number {
  return nearestScroller(node)?.scrollTop ?? window.scrollY;
}

export function writeRosterScroll(node: HTMLElement | null, y: number) {
  const scroller = nearestScroller(node);
  if (scroller) scroller.scrollTop = y;
  else window.scrollTo(0, y);
}

"use client";

import {
  COMFORTABLE_SHARE_HEIGHT,
  MAX_CANVAS_SIDE,
  isShareUrlAllowed,
  shareFilename,
  splitHeightsIntoPages,
  type ShareOptionId,
  type ShareSurface,
} from "@/lib/share-export";

const HIDE_CLASS = "share-capture-hide";

export type SharePicture = {
  blob: Blob;
  dataUrl: string;
  filename: string;
  width: number;
  height: number;
};

export type CaptureFilter = {
  hideSections?: string[];
  rowStatus?: string[];
  gameStatus?: string[];
};

function hide(el: Element) {
  el.classList.add(HIDE_CLASS);
}

function clearHides(root: HTMLElement) {
  root.querySelectorAll(`.${HIDE_CLASS}`).forEach((el) => {
    el.classList.remove(HIDE_CLASS);
  });
}

function applyFilter(root: HTMLElement, filter: CaptureFilter | undefined) {
  root.querySelectorAll("[data-share-hide]").forEach(hide);

  if (filter?.hideSections?.length) {
    const skip = new Set(filter.hideSections);
    root.querySelectorAll("[data-share-section]").forEach((el) => {
      const name = el.getAttribute("data-share-section");
      if (name && skip.has(name)) hide(el);
    });
  }

  if (filter?.rowStatus?.length) {
    const allow = new Set(filter.rowStatus);
    root.querySelectorAll("[data-share-row]").forEach((el) => {
      const status = el.getAttribute("data-status") ?? "";
      if (!allow.has(status)) hide(el);
    });
  }

  if (filter?.gameStatus?.length) {
    const allow = new Set(filter.gameStatus);
    root.querySelectorAll("[data-share-game]").forEach((el) => {
      const status = el.getAttribute("data-game-status") ?? "";
      if (!allow.has(status)) hide(el);
    });
  }
}

async function inlineImages(root: HTMLElement): Promise<() => void> {
  const imgs = Array.from(root.querySelectorAll("img"));
  const restores: Array<() => void> = [];

  await Promise.all(
    imgs.map(async (img) => {
      const src = img.currentSrc || img.getAttribute("src") || "";
      if (!src || src.startsWith("data:") || src.startsWith("blob:")) return;
      if (!isShareUrlAllowed(src) && !src.startsWith("http")) return;
      try {
        const proxied = isShareUrlAllowed(src)
          ? `/api/share/image?url=${encodeURIComponent(src)}`
          : src;
        const res = await fetch(proxied, { credentials: "same-origin" });
        if (!res.ok) return;
        const blob = await res.blob();
        if (!blob.type.startsWith("image/")) return;
        const url = URL.createObjectURL(blob);
        const prev = img.getAttribute("src");
        img.setAttribute("src", url);
        restores.push(() => {
          if (prev == null) img.removeAttribute("src");
          else img.setAttribute("src", prev);
          URL.revokeObjectURL(url);
        });
      } catch {
        // leave the original src — capture may omit the mark
      }
    })
  );

  return () => restores.forEach((fn) => fn());
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [head, body] = dataUrl.split(",");
  const mime = head?.match(/data:([^;]+)/)?.[1] ?? "image/png";
  const bytes = atob(body ?? "");
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

async function nodeToPng(
  node: HTMLElement,
  pixelRatio: number
): Promise<string> {
  const { toPng } = await import("html-to-image");
  return toPng(node, {
    pixelRatio,
    backgroundColor: "#0b0e12",
    cacheBust: true,
  });
}

async function captureVisible(
  root: HTMLElement,
  pixelRatio: number
): Promise<SharePicture & { dataUrl: string }> {
  const dataUrl = await nodeToPng(root, pixelRatio);
  const blob = dataUrlToBlob(dataUrl);
  const dims = await blobImageSize(blob);
  return {
    blob,
    dataUrl,
    filename: "survive-sunday.png",
    width: dims.width,
    height: dims.height,
  };
}

function blobImageSize(blob: Blob): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      resolve({ width: 0, height: 0 });
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}

function filterForOption(
  surface: ShareSurface,
  option: ShareOptionId
): CaptureFilter | undefined {
  if (option === "full") return undefined;
  if (option === "picks") {
    return surface === "scores"
      ? { hideSections: ["games"] }
      : { hideSections: ["tiebreak"] };
  }
  if (option === "still-in") {
    return {
      hideSections: ["tiebreak"],
      rowStatus: ["undefeated", "one_loss"],
    };
  }
  if (option === "undefeated") {
    return { hideSections: ["tiebreak"], rowStatus: ["undefeated"] };
  }
  if (option === "games") {
    return { hideSections: ["picks"] };
  }
  if (option === "live") {
    return { hideSections: ["picks"], gameStatus: ["live"] };
  }
  return undefined;
}

function semanticPages(
  surface: ShareSurface
): Array<{ filter: CaptureFilter; label: string }> {
  if (surface === "board") {
    return [
      {
        label: "still-in",
        filter: {
          hideSections: ["tiebreak"],
          rowStatus: ["undefeated", "one_loss"],
        },
      },
      {
        label: "out",
        filter: { hideSections: ["tiebreak"], rowStatus: ["eliminated"] },
      },
      {
        label: "tiebreak",
        filter: {
          hideSections: [],
          rowStatus: ["__none__"],
        },
      },
    ];
  }
  return [
    { label: "scores", filter: { hideSections: ["picks"] } },
    { label: "picks", filter: { hideSections: ["games"] } },
  ];
}

async function withPreparedRoot<T>(
  root: HTMLElement,
  filter: CaptureFilter | undefined,
  fn: () => Promise<T>
): Promise<T> {
  root.classList.add("share-capturing");
  applyFilter(root, filter);
  const restoreImgs = await inlineImages(root);
  try {
    await document.fonts?.ready.catch(() => undefined);
    return await fn();
  } finally {
    restoreImgs();
    clearHides(root);
    root.classList.remove("share-capturing");
  }
}

function safePixelRatio(cssHeight: number): number {
  const width = Math.min(window.innerWidth, 720) || 390;
  for (const ratio of [2, 1.5, 1]) {
    if (cssHeight * ratio <= MAX_CANVAS_SIDE && width * ratio <= MAX_CANVAS_SIDE) {
      return ratio;
    }
  }
  return 1;
}

async function captureOne(
  root: HTMLElement,
  filter: CaptureFilter | undefined
): Promise<SharePicture> {
  return withPreparedRoot(root, filter, async () => {
    const cssHeight = Math.max(root.scrollHeight, root.offsetHeight);
    const ratio = safePixelRatio(cssHeight);
    return captureVisible(root, ratio);
  });
}

function chunkNodes(root: HTMLElement): HTMLElement[] {
  const marked = Array.from(
    root.querySelectorAll<HTMLElement>("[data-share-chunk]")
  ).filter((el) => !el.classList.contains(HIDE_CLASS));
  if (marked.length) return marked;
  return Array.from(root.children).filter(
    (el): el is HTMLElement => el instanceof HTMLElement
  );
}

async function captureByChunks(
  root: HTMLElement,
  filter: CaptureFilter | undefined
): Promise<SharePicture[]> {
  return withPreparedRoot(root, filter, async () => {
    const chunks = chunkNodes(root);
    const heights = chunks.map((el) => el.offsetHeight || 1);
    const pages = splitHeightsIntoPages(heights, COMFORTABLE_SHARE_HEIGHT);
    if (pages.length <= 1) {
      const cssHeight = Math.max(root.scrollHeight, root.offsetHeight);
      return [await captureVisible(root, safePixelRatio(cssHeight))];
    }
    const pictures: SharePicture[] = [];
    for (const indexes of pages) {
      const keep = new Set(indexes);
      chunks.forEach((el, i) => {
        if (!keep.has(i)) hide(el);
      });
      const cssHeight = Math.max(root.scrollHeight, root.offsetHeight);
      pictures.push(await captureVisible(root, safePixelRatio(cssHeight)));
      chunks.forEach((el, i) => {
        if (!keep.has(i)) el.classList.remove(HIDE_CLASS);
      });
    }
    return pictures;
  });
}

export async function captureSharePictures(args: {
  root: HTMLElement;
  surface: ShareSurface;
  weekLabel: string;
  option: ShareOptionId;
}): Promise<SharePicture[]> {
  const { root, surface, weekLabel, option } = args;

  let pictures: SharePicture[];
  if (option === "pages") {
    const pages: SharePicture[] = [];
    for (const part of semanticPages(surface)) {
      try {
        const pic = await captureOne(root, part.filter);
        if (pic.height > 40) pages.push(pic);
      } catch {
        // skip empty / failed slice
      }
    }
    pictures = pages.length ? pages : await captureByChunks(root, undefined);
  } else {
    const filter = filterForOption(surface, option);
    const first = await captureOne(root, filter);
    if (
      option === "full" &&
      first.height > MAX_CANVAS_SIDE
    ) {
      pictures = await captureByChunks(root, filter);
    } else {
      pictures = [first];
    }
  }

  const count = pictures.length;
  return pictures.map((pic, i) => ({
    ...pic,
    filename: shareFilename({
      surface,
      weekLabel,
      option,
      page: count > 1 ? i + 1 : undefined,
      pages: count > 1 ? count : undefined,
    }),
  }));
}

export function downloadPicture(picture: SharePicture) {
  const url = URL.createObjectURL(picture.blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = picture.filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function canSharePictures(pictures: SharePicture[]): boolean {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
    return false;
  }
  if (!pictures.length) return false;
  try {
    const files = pictures.map(
      (p) => new File([p.blob], p.filename, { type: p.blob.type || "image/png" })
    );
    if (navigator.canShare) return navigator.canShare({ files });
    return true;
  } catch {
    return false;
  }
}

export async function sharePictures(
  pictures: SharePicture[],
  title: string
): Promise<"shared" | "cancelled" | "unsupported"> {
  if (!canSharePictures(pictures)) return "unsupported";
  const files = pictures.map(
    (p) => new File([p.blob], p.filename, { type: p.blob.type || "image/png" })
  );
  try {
    await navigator.share({ files, title, text: title });
    return "shared";
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") return "cancelled";
    if (files.length > 1) {
      try {
        await navigator.share({
          files: [files[0]!],
          title,
          text: title,
        });
        return "shared";
      } catch (inner) {
        if (inner instanceof Error && inner.name === "AbortError") {
          return "cancelled";
        }
        return "unsupported";
      }
    }
    return "unsupported";
  }
}

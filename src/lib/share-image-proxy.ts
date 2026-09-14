import { isShareUrlAllowed } from "@/lib/share-export";

export const SHARE_IMAGE_MAX_BYTES = 800_000;

const IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/x-icon",
]);

export function parseShareImageUrl(raw: unknown): URL | null {
  if (typeof raw !== "string" || !raw.trim()) return null;
  if (!isShareUrlAllowed(raw.trim())) return null;
  try {
    return new URL(raw.trim());
  } catch {
    return null;
  }
}

export function shareImageTypeAllowed(contentType: string | null): boolean {
  if (!contentType) return false;
  const type = contentType.split(";")[0]?.trim().toLowerCase() ?? "";
  return IMAGE_TYPES.has(type);
}

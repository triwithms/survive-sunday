import { formatEasternDateTime } from "@/lib/eastern-time";

export function formatNewsDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return null;
  const label = formatEasternDateTime(new Date(t), {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  return label || iso.slice(0, 10);
}

export function formatInjuryWhen(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return null;
  const label = formatEasternDateTime(new Date(t), {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  return label || iso.slice(0, 10);
}

export function injuryChipClass(status: string): string {
  const s = status.toLowerCase();
  if (s === "out" || s === "suspension" || s === "suspended") {
    return "chip-eliminated";
  }
  if (s === "doubtful") return "chip-live";
  if (s === "questionable") return "chip-gold";
  return "chip-one-loss";
}

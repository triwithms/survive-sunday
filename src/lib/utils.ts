import { clsx, type ClassValue } from "clsx";
import { formatEasternDateTime } from "@/lib/eastern-time";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatKickoff(d: Date | string | null | undefined) {
  return formatEasternDateTime(d, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

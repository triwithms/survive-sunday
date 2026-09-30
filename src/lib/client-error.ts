/**
 * Shape of a crash report from a player screen. Shared by the browser
 * reporter and the API route. No emails, phone numbers, or query strings.
 */

export const CLIENT_ERROR_ENDPOINT = "/api/client-error";

const MAX_MESSAGE = 500;
const MAX_PANEL = 40;
const MAX_PATH = 120;

const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE_LIKE = /\+?\d[\d\s().-]{7,}\d/g;

function scrubPhone(match: string): string {
  const digits = match.replace(/\D/g, "").length;
  return digits >= 10 && digits <= 15 ? "[phone]" : match;
}

export function scrubPii(text: string): string {
  return text.replace(EMAIL, "[email]").replace(PHONE_LIKE, scrubPhone);
}

export type ClientErrorReport = {
  panel: string;
  path: string;
  message: string;
};

function cleanPanel(value: unknown): string {
  const text = typeof value === "string" ? value : "";
  const panel = text.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, MAX_PANEL);
  return panel || "page";
}

function cleanPath(value: unknown): string {
  const text = typeof value === "string" ? value : "";
  const path = text.split(/[?#]/)[0] ?? "";
  if (!path.startsWith("/")) return "/";
  return scrubPii(path).slice(0, MAX_PATH);
}

function cleanMessage(value: unknown): string {
  const text = typeof value === "string" ? value : "";
  return scrubPii(text.replace(/\s+/g, " ").trim()).slice(0, MAX_MESSAGE);
}

export function errorMessage(error: unknown): string {
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  return String(error);
}

export function clientErrorReport(input: {
  panel: unknown;
  path: unknown;
  message: unknown;
}): ClientErrorReport | null {
  const message = cleanMessage(input.message);
  if (!message) return null;
  return {
    panel: cleanPanel(input.panel),
    path: cleanPath(input.path),
    message,
  };
}

export function parseClientErrorBody(body: unknown): ClientErrorReport | null {
  if (!body || typeof body !== "object") return null;
  const row = body as Record<string, unknown>;
  return clientErrorReport({
    panel: row.panel,
    path: row.path,
    message: row.message,
  });
}

/** Admin → System → Server errors route column. */
export function clientErrorRoute(report: ClientErrorReport): string {
  return `${report.path} · ${report.panel}`;
}

/** Caps writes per warm instance so a render loop cannot flood the table. */
export function createRateGate(limit: number, windowMs: number) {
  let windowStart = 0;
  let count = 0;
  return (now: number): boolean => {
    if (now - windowStart >= windowMs) {
      windowStart = now;
      count = 0;
    }
    if (count >= limit) return false;
    count += 1;
    return true;
  };
}

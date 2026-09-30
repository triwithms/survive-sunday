import {
  CLIENT_ERROR_ENDPOINT,
  clientErrorReport,
  errorMessage,
} from "./client-error";

const MAX_PER_PAGE_LOAD = 5;
const sent = new Set<string>();

/** Browser only. Never throws. One report per panel + message per page load. */
export function reportClientError(panel: string, error: unknown): void {
  try {
    if (typeof window === "undefined") return;
    const report = clientErrorReport({
      panel,
      path: window.location.pathname,
      message: errorMessage(error),
    });
    if (!report) return;
    const key = `${report.panel}|${report.message}`;
    if (sent.has(key) || sent.size >= MAX_PER_PAGE_LOAD) return;
    sent.add(key);
    const body = JSON.stringify(report);
    const beacon =
      typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function"
        ? navigator.sendBeacon(
            CLIENT_ERROR_ENDPOINT,
            new Blob([body], { type: "text/plain;charset=UTF-8" })
          )
        : false;
    if (beacon) return;
    void fetch(CLIENT_ERROR_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // reporting must never add a second failure
  }
}

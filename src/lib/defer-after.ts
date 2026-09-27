import "server-only";
import { after } from "next/server";
import { recordServerError } from "./server-error-log";

/**
 * Work triggered while painting a player page. Runs after the response.
 * A throw is stored for Admin → System and never fails the page.
 */
export function deferAfter(label: string, task: () => Promise<unknown>): void {
  const run = (): Promise<void> =>
    Promise.resolve()
      .then(task)
      .then(() => undefined)
      .catch((error: unknown) => {
        console.error(label, error);
        const message = error instanceof Error ? error.message : String(error);
        return recordServerError({
          route: label,
          message,
          source: "background",
        });
      });

  try {
    after(run);
  } catch (error) {
    console.error(`${label} after() unavailable`, error);
    void run();
  }
}

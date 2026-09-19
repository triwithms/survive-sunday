import type { A2hsStatus } from "@/components/features/a2hs/state";

export function homeScreenStatusLine(status: A2hsStatus): string {
  if (status === "optout") return "This phone will not ask again.";
  if (status === "installed") return "This phone is marked as added.";
  if (status === "not_now") {
    return "This phone said Not now — will ask again next sign-in.";
  }
  return "This phone will ask to add NFL Pool.";
}

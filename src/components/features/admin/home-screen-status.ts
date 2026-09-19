import type { A2hsStatus } from "@/components/features/a2hs/state";

export function homeScreenStatusLine(status: A2hsStatus): string {
  if (status === "optout") return "This phone will not ask again.";
  if (status === "installed") return "This phone is marked as added.";
  if (status === "snoozed") return "This phone said Later — it will ask again in a few days.";
  return "This phone will ask to add Survive Sunday.";
}

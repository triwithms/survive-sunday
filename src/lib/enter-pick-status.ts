/** Out cannot pick. Shared by the enter-pick form and its save check. */
export function enterPickStatusError(status: string): string | null {
  if (status === "eliminated") return "Out — no pick.";
  return null;
}

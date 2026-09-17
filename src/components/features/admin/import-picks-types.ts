export type ImportPreviewRow = {
  input: string;
  nickname: string;
  email?: string;
  teamAbbr: string;
  ok: boolean;
  error?: string;
  matchBy?: "nickname" | "email";
  existingTeam?: string | null;
  existingResult?: string | null;
};

export type ImportFeedback =
  | {
      kind: "success";
      weekNumber: number;
      imported: number;
      failed: number;
      details: unknown;
    }
  | { kind: "error"; message: string; details?: unknown };

export function importErrorMessage(data: unknown, fallback: string) {
  if (typeof data === "object" && data !== null && "error" in data) {
    const error = (data as { error?: unknown }).error;
    if (typeof error === "string" && error) return error;
  }
  return fallback;
}

export const DEFAULT_IMPORT_CSV =
  "nickname,team\nGams,DET\nBlack Cobra,SEA\nCannoli Stuffer,SF\nColin,CAR\nDaddy Chill,TB\nDeep and Delicious,IND\nGdogss,HOU\nJimmyC,NYJ\nLong Snapper,ATL\nSteve,KC\n";

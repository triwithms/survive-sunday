export function pickConfirmedCopy(args: {
  nickname: string;
  weekNumber: number;
  teamAbbr: string;
  changed: boolean;
}) {
  const verb = args.changed ? "changed" : "confirmed";
  const subject = args.changed
    ? `Pick changed — Week ${args.weekNumber} ${args.teamAbbr}`
    : `Pick confirmed — Week ${args.weekNumber} ${args.teamAbbr}`;
  const text = [
    `Hi ${args.nickname},`,
    "",
    `Your Week ${args.weekNumber} pick is ${verb}: ${args.teamAbbr}.`,
    "You can change it until lock (Week 1: until that team’s kickoff if the new game hasn’t started).",
    "",
    "Survive Sunday",
  ].join("\n");
  return { subject, text };
}

export function resultsGradedCopy(args: {
  nickname: string;
  weekNumber: number;
  teamAbbr: string;
  result: string;
}) {
  const subject = `Week ${args.weekNumber} graded — ${args.teamAbbr} ${args.result}`;
  const text = [
    `Hi ${args.nickname},`,
    "",
    `Your Week ${args.weekNumber} pick (${args.teamAbbr}) is a ${args.result}.`,
    "",
    "Survive Sunday",
  ].join("\n");
  return { subject, text };
}

export function mulliganEliminatedCopy(args: {
  nickname: string;
  status: string;
}) {
  if (args.status === "eliminated") {
    return {
      subject: "You’re eliminated",
      text: [
        `Hi ${args.nickname},`,
        "",
        "That’s a second loss — you’re eliminated for the season. You can still follow the board.",
        "",
        "Survive Sunday",
      ].join("\n"),
    };
  }
  return {
    subject: "Mulligan used — one loss",
    text: [
      `Hi ${args.nickname},`,
      "",
      "Your mulligan absorbed that loss. You’re still in with one loss.",
      "",
      "Survive Sunday",
    ].join("\n"),
  };
}

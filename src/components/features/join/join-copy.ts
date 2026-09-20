export function joinLead(args: {
  newPlayer: boolean;
  viaPersonal: boolean;
  invitedLabel?: string | null;
  claimed: boolean;
}): string {
  if (args.newPlayer) {
    return "Choose a nickname your friends will recognise. Join once with your email and a password. Stay signed in on this phone.";
  }
  if (args.viaPersonal && args.invitedLabel && !args.claimed) {
    return "Your name is picked. Enter your email and a password — once. Stay signed in on this phone.";
  }
  return "Join once with your email and a password. Stay signed in on this phone.";
}

export function joinSubmitLabel(busy: boolean, nickname?: string | null): string {
  if (busy) return "Joining…";
  if (nickname) return `Join as ${nickname}`;
  return "Join pool";
}

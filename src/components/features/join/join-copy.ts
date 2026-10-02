export function joinLead(args: {
  viaPersonal: boolean;
  invitedLabel?: string | null;
  claimed: boolean;
}): string {
  if (args.viaPersonal && args.invitedLabel && !args.claimed) {
    return "Your name is picked. Enter your email and a password — once. Stay signed in on this phone.";
  }
  return "Enter the email and password for this seat. Stay signed in on this phone.";
}

export function joinSubmitLabel(busy: boolean, nickname?: string | null): string {
  if (busy) return "Joining…";
  if (nickname) return `Join as ${nickname}`;
  return "Join";
}

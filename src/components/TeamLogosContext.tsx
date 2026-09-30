"use client";

import { createContext, useContext } from "react";

const TeamLogosContext = createContext(true);

/** Set once in the (app) layout from the active pool + TEAM_LOGOS_DISABLED. */
export function TeamLogosProvider({
  on,
  children,
}: {
  on: boolean;
  children: React.ReactNode;
}) {
  return <TeamLogosContext.Provider value={on}>{children}</TeamLogosContext.Provider>;
}

export function useTeamLogosOn(): boolean {
  return useContext(TeamLogosContext);
}

"use client";

import { useEffect, useState } from "react";
import { optOutA2hs, reopenA2hsNudge } from "@/components/features/a2hs/actions";
import { readA2hsState, type A2hsStatus } from "@/components/features/a2hs/state";
import { Button, Card } from "@/components/ui";
import { homeScreenStatusLine } from "./home-screen-status";

export function HomeScreenPanel() {
  const [status, setStatus] = useState<A2hsStatus>("pending");

  function refresh() {
    setStatus(readA2hsState().status);
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <Card as="section" className="p-4 space-y-3" data-testid="home-screen-admin">
      <div>
        <h2 className="font-semibold">Home Screen install</h2>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Friends on a phone browser are asked to add the app. Each phone
          remembers its own choice. Account can bring the card back.
        </p>
      </div>
      <p className="text-sm text-field-400" role="status">
        {homeScreenStatusLine(status)}
      </p>
      <Button
        className="w-full min-h-11"
        onClick={() => {
          reopenA2hsNudge();
          refresh();
        }}
      >
        Remind this phone
      </Button>
      <Button
        variant="secondary"
        className="w-full min-h-11"
        onClick={() => {
          optOutA2hs();
          refresh();
        }}
      >
        Don’t ask on this phone
      </Button>
    </Card>
  );
}

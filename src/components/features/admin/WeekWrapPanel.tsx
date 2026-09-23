"use client";

import { Card } from "@/components/ui";
import type { WeekWrapPanelData } from "@/lib/week-wrap-types";
import { wrapAutoStatus } from "@/lib/week-wrap-status";
import { WeekWrapActions } from "./WeekWrapActions";
import { WeekWrapControls } from "./WeekWrapControls";
import { WeekWrapOverrides } from "./WeekWrapOverrides";
import { WeekWrapPreview } from "./WeekWrapPreview";
import { useWeekWrap } from "./use-week-wrap";

export function WeekWrapPanel({ data }: { data: WeekWrapPanelData }) {
  const w = useWeekWrap(data);
  return (
    <Card
      as="section"
      id="week-wrap"
      className="space-y-3 p-4"
      data-testid="week-wrap"
    >
      <div>
        <h2 className="font-semibold">Week wrap</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Automatic email at noon (America/Toronto) the day after the last
          game is final. The email shows who won, lost, and went out with
          team helmets, then the pool leaderboard and NFL division standings.
          If the NFL has posted “Every Touchdown of Week N”, that link is
          added when this sends. Texts stay short facts.
        </p>
      </div>
      {w.week ? (
        <>
          <WeekWrapControls
            weeks={w.weeks}
            weekNumber={w.week.number}
            onWeek={w.setWeekNumber}
            tone={w.tone}
            onTone={w.setTone}
            blocks={w.blocks}
            onToggle={w.toggle}
            status={wrapAutoStatus(w.week)}
          />
          <WeekWrapOverrides
            emailOverride={w.emailOverride}
            smsOverride={w.smsOverride}
            onEmail={w.setEmailOverride}
            onSms={w.setSmsOverride}
          />
          {w.preview ? (
            <WeekWrapPreview
              subject={w.preview.subject}
              html={w.preview.html ?? w.preview.htmlBody}
              text={w.preview.text}
              sms={w.preview.smsBody ?? w.preview.text}
            />
          ) : null}
          <WeekWrapActions
            weekNumber={w.week.number}
            audience={data.audience}
            busy={w.busy}
            msg={w.msg}
            err={w.err}
            onSave={() => void w.run("save")}
            onSend={() => void w.run("send")}
            onSkip={() => void w.run("skip")}
          />
        </>
      ) : (
        <p className="text-sm text-[var(--text-muted)]">No weeks on the slate yet.</p>
      )}
    </Card>
  );
}

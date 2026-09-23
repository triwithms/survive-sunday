import { Button } from "@/components/ui";
import type { NoticeCounts } from "@/lib/notice-audience";
import { WeekWrapSend } from "./WeekWrapSend";

export function WeekWrapActions(props: {
  weekNumber: number;
  audience: NoticeCounts;
  busy: "" | "save" | "send" | "skip";
  msg: string;
  err: string;
  onSave: () => void;
  onSend: () => void;
  onSkip: () => void;
}) {
  const busy = props.busy !== "";
  return (
    <div className="space-y-2">
      <WeekWrapSend
        weekNumber={props.weekNumber}
        audience={props.audience}
        busy={props.busy === "send"}
        onSend={props.onSend}
      />
      <Button
        variant="secondary"
        className="w-full min-h-11"
        disabled={busy}
        onClick={props.onSave}
        data-testid="week-wrap-save"
      >
        {props.busy === "save" ? "Saving…" : "Save defaults"}
      </Button>
      <Button
        variant="secondary"
        className="w-full min-h-11"
        disabled={busy}
        onClick={props.onSkip}
        data-testid="week-wrap-skip"
      >
        {props.busy === "skip" ? "Skipping…" : "Skip this week"}
      </Button>
      {props.msg ? <p className="text-sm text-gold-400">{props.msg}</p> : null}
      {props.err ? <p className="text-sm text-crimson-400">{props.err}</p> : null}
    </div>
  );
}

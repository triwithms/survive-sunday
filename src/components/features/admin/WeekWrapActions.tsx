import { Button } from "@/components/ui";

export function WeekWrapActions(props: {
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
      <Button
        className="w-full min-h-11"
        disabled={busy}
        onClick={props.onSend}
        data-testid="week-wrap-send"
      >
        {props.busy === "send" ? "Sending…" : "Send now"}
      </Button>
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

import { ShareGlyph } from "./ShareGlyph";

/** Apple blocks a one-tap install. Show ⋯ → Share (□↑) → Add to Home Screen. */
export function A2hsIosHint() {
  return (
    <div className="space-y-2">
      <div className="flex justify-center text-gold-400" aria-hidden>
        <ShareGlyph size={56} />
      </div>
      <p className="text-sm text-[var(--text-muted)]">
        Must use the <strong className="text-[var(--text-primary)]">Safari</strong>{" "}
        app (not Chrome or in-app browsers).
      </p>
      <ol className="list-decimal pl-5 space-y-1 text-sm text-[var(--text-muted)]">
        <li className="text-[var(--text-primary)]">
          Open NFL Pool in the <strong>Safari</strong> app.
        </li>
        <li className="text-[var(--text-primary)]">
          Beside the website address at the top, tap <strong>⋯</strong> (three
          dots).
        </li>
        <li className="text-[var(--text-primary)]">
          Tap <strong>Share</strong>{" "}
          <ShareGlyph
            className="inline-block align-[-3px] text-[var(--text-primary)]"
            size={18}
          />{" "}
          (square with arrow pointing up).
        </li>
        <li className="text-[var(--text-primary)]">
          Scroll → <strong>Add to Home Screen</strong>
          {" → "}
          <strong>Add</strong> (name can stay <strong>NFL Pool</strong>).
        </li>
        <li className="text-[var(--text-primary)]">
          Close Safari (swipe away the app or that tab) and open only from the
          Home Screen icon — otherwise it can look like two copies open.
        </li>
      </ol>
      <p className="text-sm text-[var(--text-muted)]">
        If{" "}
        <strong className="text-[var(--text-primary)]">Add to Home Screen</strong>{" "}
        is missing: bottom of the Share list →{" "}
        <strong className="text-[var(--text-primary)]">Edit Actions</strong> →
        enable{" "}
        <strong className="text-[var(--text-primary)]">Add to Home Screen</strong>{" "}
        → try again.
      </p>
    </div>
  );
}

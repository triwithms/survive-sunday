import { ShareGlyph } from "./ShareGlyph";

/** Apple blocks a one-tap install. Show □↑ and where it lives. */
export function A2hsIosHint() {
  return (
    <div className="space-y-2">
      <div className="flex justify-center text-gold-400" aria-hidden>
        <ShareGlyph size={56} />
      </div>
      <p className="text-sm text-[var(--text-muted)]">
        Tap{" "}
        <ShareGlyph
          className="inline-block align-[-3px] text-[var(--text-primary)]"
          size={18}
        />{" "}
        at the bottom of Safari →{" "}
        <strong className="text-[var(--text-primary)]">Add to Home Screen</strong>
        {" → "}
        <strong className="text-[var(--text-primary)]">Add</strong>
      </p>
    </div>
  );
}

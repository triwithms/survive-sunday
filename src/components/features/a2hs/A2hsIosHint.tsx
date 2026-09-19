import { ShareGlyph } from "./ShareGlyph";

/** Apple blocks a one-tap install. Show the button, then the menu item. */
export function A2hsIosHint() {
  return (
    <div className="space-y-3">
      <div className="flex justify-center text-gold-400" aria-hidden>
        <ShareGlyph size={56} />
      </div>
      <p className="text-sm text-[var(--text-muted)]">
        In Safari, tap{" "}
        <ShareGlyph
          className="inline-block align-[-3px] text-[var(--text-primary)]"
          size={18}
        />{" "}
        at the bottom of Safari (top on iPad) →{" "}
        <strong className="text-[var(--text-primary)]">Add to Home Screen</strong>
        {" → "}
        <strong className="text-[var(--text-primary)]">Add</strong>
      </p>
    </div>
  );
}

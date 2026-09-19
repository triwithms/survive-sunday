import type { TeamStyleView } from "./types";

export function TeamStyle({ style }: { style: TeamStyleView }) {
  return (
    <section className="card-glass p-4 space-y-2">
      <h2 className="text-xl font-semibold text-gold-400">Style summary</h2>
      <ul className="text-base space-y-1.5">
        <li>
          <span className="text-[var(--text-muted)]">Offence:</span>{" "}
          {style.offence}
        </li>
        <li>
          <span className="text-[var(--text-muted)]">Defence:</span>{" "}
          {style.defence}
        </li>
        <li>
          <span className="text-[var(--text-muted)]">Run / pass:</span>{" "}
          {style.runPass}
        </li>
      </ul>
      {style.basis && (
        <p className="text-sm text-[var(--text-muted)] leading-relaxed">
          {style.basis}
        </p>
      )}
    </section>
  );
}

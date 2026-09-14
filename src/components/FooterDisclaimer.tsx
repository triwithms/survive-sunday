import { DISCLAIMER } from "@/lib/constants";

export function FooterDisclaimer() {
  return (
    <p
      data-share-chrome=""
      className="text-center text-xs text-[var(--text-muted)] px-4 py-6 max-w-prose mx-auto"
    >
      {DISCLAIMER}
    </p>
  );
}

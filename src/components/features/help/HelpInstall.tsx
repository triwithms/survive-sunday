import { HelpInstallLink } from "@/components/features/a2hs";
import { A2hsIosHint } from "@/components/features/a2hs/A2hsIosHint";

export function HelpInstall() {
  return (
    <section id="install-home-screen">
      <h2 className="text-lg font-semibold text-gold-400 mb-2">
        Install on Home Screen
      </h2>
      <div className="card-glass border border-gold-400/30 p-4 space-y-3">
        <p className="text-[var(--text-primary)]">
          Add <strong>NFL Pool</strong> so it opens like an app and stays signed
          in on this phone.
        </p>
        <p>
          <HelpInstallLink />
        </p>
        <p className="text-[var(--text-muted)]">
          Tap that link to re-open the Yes steps. After Sign in we may ask{" "}
          <strong>Yes</strong> / <strong>No — don’t ask again</strong> /{" "}
          <strong>Not now</strong>. Not now asks again next Sign in. No never
          auto-asks; this link still opens Yes.
        </p>
        <A2hsIosHint />
        <p className="text-[var(--text-muted)]">
          <strong className="text-[var(--text-primary)]">Android:</strong> Chrome
          → Install, or the three-dot menu.
        </p>
      </div>
    </section>
  );
}

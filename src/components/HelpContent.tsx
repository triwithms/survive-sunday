import { HelpAccount } from "@/components/features/help/HelpAccount";
import { HelpForAdmins } from "@/components/features/help/HelpForAdmins";
import { HelpImportGlossary } from "@/components/features/help/HelpImportGlossary";
import { HelpIntro } from "@/components/features/help/HelpIntro";
import { HelpRules } from "@/components/features/help/HelpRules";
import { HelpScreens } from "@/components/features/help/HelpScreens";

export function HelpContent({ showDemoCopy = false }: { showDemoCopy?: boolean }) {
  return (
    <article className="prose-survive space-y-6 text-sm leading-relaxed max-w-[68ch]">
      <HelpIntro />
      <HelpRules />
      <HelpScreens />
      <HelpAccount showDemoCopy={showDemoCopy} />
      <HelpForAdmins showDemoCopy={showDemoCopy} />
      <HelpImportGlossary />
      <p className="text-xs text-[var(--text-muted)] pt-4 border-t border-stadium-border">
        For entertainment among friends. Not a gambling service. Spreads and moneylines are informational only.
      </p>
    </article>
  );
}

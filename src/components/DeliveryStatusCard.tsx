import type { EmailDeliveryStatus } from "@/lib/delivery";

export function DeliveryStatusCard({ status }: { status: EmailDeliveryStatus }) {
  return (
    <section className="card-glass p-4 space-y-2">
      <h2 className="font-semibold">Sign-in and reset emails</h2>
      <p
        className={`text-sm ${status.ready ? "text-field-400" : "text-crimson-400"}`}
        role="status"
      >
        {status.message}
      </p>
      <ul className="text-sm text-[var(--text-muted)] space-y-1">
        <li>
          Resend API key:{" "}
          <strong className="text-[var(--text-primary)]">
            {status.hasApiKey ? "set" : "missing"}
          </strong>
        </li>
        <li>
          From address:{" "}
          <strong className="text-[var(--text-primary)]">
            {status.hasFromEmail
              ? status.fromIsTestAddress
                ? `${status.fromAddressMasked} (test sender — friends will not get mail)`
                : status.fromAddressMasked
              : "missing"}
          </strong>
        </li>
        <li>
          Texts (Twilio):{" "}
          <strong className="text-[var(--text-primary)]">
            {status.smsReady ? "set" : "not set (email is enough)"}
          </strong>
        </li>
      </ul>
      {!status.ready && (
        <ol className="list-decimal pl-5 text-sm text-[var(--text-muted)] space-y-1">
          <li>
            Open{" "}
            <a
              className="text-gold-400 underline"
              href="https://vercel.com"
              target="_blank"
              rel="noreferrer"
            >
              vercel.com
            </a>{" "}
            → team <strong>nfl-pool</strong> → project{" "}
            <strong>survive-sunday</strong>.
          </li>
          <li>
            <strong>Settings</strong> → <strong>Environment Variables</strong>.
          </li>
          <li>
            Confirm <code>RESEND_API_KEY</code> and{" "}
            <code>RESEND_FROM_EMAIL</code> exist, and the{" "}
            <strong>Production</strong> checkbox is ticked (Preview-only does
            not help the live site).
          </li>
          <li>
            From must be a verified domain, like{" "}
            <code>Survive Sunday &lt;noreply@yourdomain.com&gt;</code> — never{" "}
            <code>onboarding@resend.dev</code>.
          </li>
          <li>
            <strong>Deployments</strong> → ⋮ on the latest Production row →{" "}
            <strong>Redeploy</strong>. Do not tick “use existing build cache.”
          </li>
        </ol>
      )}
    </section>
  );
}

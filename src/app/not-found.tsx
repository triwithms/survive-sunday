import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-dvh mx-auto max-w-pool px-4 py-16">
      <p className="text-field-400 text-sm font-medium tracking-wide uppercase mb-3">
        404
      </p>
      <h1 className="font-display text-3xl text-gold-400 tracking-wide mb-3">
        Page not found
      </h1>
      <p className="text-[var(--text-muted)] mb-8">
        That route doesn&apos;t exist — or the pool moved the goalposts.
      </p>
      <Link href="/" className="btn-primary inline-flex items-center justify-center">
        Back to Survive Sunday
      </Link>
    </main>
  );
}

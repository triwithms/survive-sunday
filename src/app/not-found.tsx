import Link from "next/link";
import {
  PUBLIC_MISS_BODY,
  PUBLIC_MISS_HOME,
  PUBLIC_MISS_KICKER,
  PUBLIC_MISS_TITLE,
} from "@/lib/public-miss";

export default function NotFound() {
  return (
    <main className="min-h-dvh mx-auto max-w-pool px-4 py-16">
      <p className="text-field-400 text-sm font-medium tracking-wide uppercase mb-3">
        {PUBLIC_MISS_KICKER}
      </p>
      <h1 className="font-display text-3xl text-gold-400 tracking-wide mb-3">
        {PUBLIC_MISS_TITLE}
      </h1>
      <p className="text-[var(--text-muted)] mb-8">{PUBLIC_MISS_BODY}</p>
      <Link href="/" className="btn-primary inline-flex items-center justify-center">
        {PUBLIC_MISS_HOME}
      </Link>
    </main>
  );
}

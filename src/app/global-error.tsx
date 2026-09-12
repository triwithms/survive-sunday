"use client";

import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en-CA" className="dark">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          background: "#0B0E12",
          color: "#f2f4f7",
          fontFamily:
            'DM Sans, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
        }}
      >
        <main style={{ maxWidth: 560, margin: "0 auto", padding: "4rem 1rem" }}>
          <p
            style={{
              color: "#e85d5d",
              fontSize: 14,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            Error
          </p>
          <h1
            style={{
              fontSize: 32,
              color: "#e8c547",
              letterSpacing: "0.04em",
              margin: "0 0 12px",
            }}
          >
            Survive Sunday hit a snag
          </h1>
          <p style={{ color: "#9aa5b5", marginBottom: 32 }}>
            A required page failed to render
            {error?.digest ? ` (digest ${error.digest})` : ""}. This is the
            root error boundary — reload or return home.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                background: "#e8c547",
                color: "#0B0E12",
                fontWeight: 600,
                border: 0,
                borderRadius: 10,
                padding: "0.625rem 1.25rem",
                minHeight: 44,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
            <Link
              href="/"
              style={{
                background: "#243040",
                color: "#e8c547",
                fontWeight: 600,
                border: "1px solid #2e3a4a",
                borderRadius: 10,
                padding: "0.625rem 1.25rem",
                minHeight: 44,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              Home
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}

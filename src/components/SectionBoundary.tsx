"use client";

import { Component, Fragment, Suspense, type ReactNode } from "react";
import { reportClientError } from "@/lib/client-error-report";

export type SectionBoundaryVariant = "card" | "inline" | "quiet";

type Props = {
  /** Short kebab-case panel id. Shown in Admin → System → Server errors. */
  name: string;
  children: ReactNode;
  variant?: SectionBoundaryVariant;
  /** Player-facing line under "Something went wrong". */
  message?: string;
  /** Clears a caught error when this changes (e.g. the selected week). */
  resetKey?: string | number | null;
  report?: (panel: string, error: unknown) => void;
};

type State = { error: unknown; attempt: number; prevKey: Props["resetKey"] };

/**
 * Walls off a secondary panel so a throw there leaves the rest of the
 * screen usable. The Suspense child keeps a throw during server render
 * scoped here too: that region renders on the client, where this catches.
 */
export class SectionBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null, attempt: 0, prevKey: props.resetKey };
  }

  static getDerivedStateFromError(error: unknown): Partial<State> {
    return { error: error ?? new Error("Unknown render error") };
  }

  static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
    if (props.resetKey === state.prevKey) return null;
    return {
      prevKey: props.resetKey,
      error: null,
      attempt: state.error ? state.attempt + 1 : state.attempt,
    };
  }

  componentDidCatch(error: unknown) {
    console.error(`[boundary] ${this.props.name}`, error);
    (this.props.report ?? reportClientError)(this.props.name, error);
  }

  private retry = () => {
    this.setState((state) => ({ error: null, attempt: state.attempt + 1 }));
  };

  render() {
    if (!this.state.error) {
      return (
        <Fragment key={this.state.attempt}>
          <Suspense fallback={null}>{this.props.children}</Suspense>
        </Fragment>
      );
    }
    return (
      <SectionFallback
        variant={this.props.variant ?? "card"}
        message={this.props.message}
        name={this.props.name}
        onRetry={this.retry}
      />
    );
  }
}

export function SectionFallback({
  variant,
  message,
  name,
  onRetry,
}: {
  variant: SectionBoundaryVariant;
  message?: string;
  name: string;
  onRetry: () => void;
}) {
  if (variant === "quiet") return null;
  if (variant === "inline") {
    return (
      <p
        role="alert"
        data-testid="section-error"
        data-section={name}
        className="flex flex-wrap items-center gap-x-2 text-xs text-[var(--text-muted)]"
      >
        <span className="text-crimson-400">Something went wrong.</span>
        {message ? <span>{message}</span> : null}
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex min-h-11 items-center px-1 font-semibold text-gold-400 underline-offset-2 hover:underline"
        >
          Retry
        </button>
      </p>
    );
  }
  return (
    <div
      role="alert"
      data-testid="section-error"
      data-section={name}
      className="card-glass border border-crimson-400/40 p-4 space-y-3"
    >
      <div className="space-y-1">
        <p className="font-semibold text-crimson-400">Something went wrong</p>
        <p className="text-sm text-[var(--text-muted)]">
          {message ?? "This part of the screen didn’t load. The rest still works."}
        </p>
      </div>
      <button type="button" className="btn-secondary text-sm" onClick={onRetry}>
        Retry
      </button>
    </div>
  );
}

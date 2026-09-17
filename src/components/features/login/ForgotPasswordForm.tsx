"use client";

import Link from "next/link";
import { ForgotCodeStep } from "./ForgotCodeStep";
import { ForgotEmailStep } from "./ForgotEmailStep";
import { FORGOT_INTRO } from "./forgot-copy";
import { useForgotPassword } from "./use-forgot-password";

export function ForgotPasswordForm() {
  const f = useForgotPassword();

  return (
    <main className="min-h-dvh mx-auto max-w-sheet px-4 py-10">
      <Link href="/login" className="text-sm text-gold-400">
        ← Back to sign in
      </Link>
      <h1 className="font-display text-3xl text-gold-400 mt-6 mb-2">
        Forgot password
      </h1>
      <p className="text-[var(--text-muted)] text-sm mb-6">{FORGOT_INTRO}</p>

      {f.step === "email" ? (
        <ForgotEmailStep
          email={f.email}
          onEmail={f.onEmail}
          onChange={f.setEmail}
          info={f.info}
          err={f.err}
          busy={f.busy}
        />
      ) : (
        <ForgotCodeStep
          email={f.email}
          view={f.view}
          code={f.code}
          setCode={f.setCode}
          password={f.password}
          setPassword={f.setPassword}
          confirm={f.confirm}
          setConfirm={f.setConfirm}
          info={f.info}
          err={f.err}
          busy={f.busy}
          cooldown={f.cooldown}
          onReset={f.onReset}
          onResend={() => void f.sendCode()}
        />
      )}

      {f.view?.devCode && (
        <p className="mt-4 text-xs text-[var(--text-muted)] card-glass p-3">
          Local/dev only — no email/SMS provider configured. Code:{" "}
          <span className="font-mono text-gold-400 text-base tracking-normal">
            {f.view.devCode.split("").join(" ")}
          </span>
        </p>
      )}
    </main>
  );
}

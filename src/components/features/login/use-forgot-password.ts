"use client";

import { useEffect, useRef, useState } from "react";
import { submitCredentialsLogin } from "@/lib/client-auth";
import { finishReset, sendForgotCode } from "./forgot-send";
import { sentCodeCopy } from "./forgot-copy";
import type { ChallengeView } from "./forgot-types";

export function useForgotPassword() {
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [view, setView] = useState<ChallengeView | null>(null);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const sending = useRef(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = window.setTimeout(() => setCooldown((n) => Math.max(0, n - 1)), 1000);
    return () => window.clearTimeout(t);
  }, [cooldown]);

  async function sendCode() {
    if (sending.current) return;
    sending.current = true;
    setBusy(true);
    setErr("");
    setInfo("");
    try {
      const result = await sendForgotCode(email);
      if (result.kind === "demo") {
        setInfo(result.message);
        setStep("email");
        return;
      }
      if (result.status) {
        setView((prev) => ({
          ...result.status!,
          devCode: result.status!.devCode ?? prev?.devCode,
        }));
        setCooldown(result.status.resendAvailableInSec ?? 0);
      }
      if (result.kind === "error") {
        setErr(result.error);
        return;
      }
      setStep("code");
      setInfo(sentCodeCopy(Boolean(result.status?.canSms)));
    } catch {
      setErr("Could not send a code. Check your connection and try again.");
    } finally {
      sending.current = false;
      setBusy(false);
    }
  }

  async function onEmail(e: React.FormEvent) {
    e.preventDefault();
    await sendCode();
  }

  async function onReset(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setErr("Those passwords don’t match.");
      return;
    }
    setBusy(true);
    setErr("");
    try {
      const result = await finishReset(email, code, password);
      if (!result.ok) {
        setErr(result.error);
        return;
      }
      submitCredentialsLogin(email, password, "/pick");
    } catch {
      setErr("Could not finish the reset. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return {
    step, email, setEmail, code, setCode, password, setPassword,
    confirm, setConfirm, view, err, info, busy, cooldown,
    sendCode, onEmail, onReset,
  };
}

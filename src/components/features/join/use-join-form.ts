"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { INVITE_CODE } from "@/lib/constants";
import type { ClaimableSeat } from "@/lib/claim-seat";
import { CLAIM_ERRORS } from "@/lib/claim-seat";
import { joinInviteFromParams, joinSignInHref } from "./join-invite";
import { runJoinSubmit } from "./join-run";

type Args = {
  seats: ClaimableSeat[];
  signedIn?: { email: string; userId: string } | null;
  tokenSeatId?: string | null;
};

export function useJoinForm({ seats, signedIn, tokenSeatId }: Args) {
  const params = useSearchParams();
  const tokenParam = params.get("t") ?? "";
  const invite = joinInviteFromParams({
    seats,
    tokenSeatId,
    tokenParam,
    seatParam: tokenSeatId || params.get("seat") || "",
    whoParam: tokenSeatId ? "" : params.get("who") ?? "",
    signedInEmail: signedIn?.email,
  });
  const { invited, viaPersonal, sessionEmail } = invite;
  const [inviteCode, setInviteCode] = useState(
    (params.get("code") ?? "").trim().toUpperCase() || INVITE_CODE
  );
  const [email, setEmail] = useState(sessionEmail);
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [realName, setRealName] = useState("");
  const [membershipId] = useState(invite.initialSeat);
  const [newPlayer] = useState(seats.length === 0 && !viaPersonal);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (sessionEmail && !email) setEmail(sessionEmail);
  }, [sessionEmail, email]);

  const selected = useMemo(
    () => seats.find((s) => s.membershipId === membershipId),
    [seats, membershipId]
  );
  const claimed = Boolean(selected?.claimed);
  const canSubmit = newPlayer || (Boolean(membershipId) && !claimed);
  const showSignInToClaim =
    !signedIn && !newPlayer && Boolean(membershipId) && !claimed &&
    (err === CLAIM_ERRORS.emailPasswordMismatch || Boolean(email));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      await runJoinSubmit({
        canSubmit, sessionEmail, email, password, newPlayer, inviteCode,
        nickname, realName, membershipId, tokenParam, setErr,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "network";
      setErr(`Join failed: ${msg}`);
    } finally {
      setBusy(false);
    }
  }

  return {
    invited, viaPersonal, inviteCode, setInviteCode, email, setEmail,
    password, setPassword, nickname, setNickname, realName, setRealName,
    newPlayer, err, busy, selected, claimed, canSubmit,
    showPassword: canSubmit, lockEmail: Boolean(sessionEmail),
    signInToClaimHref: joinSignInHref(membershipId), showSignInToClaim,
    showClaimed: viaPersonal && invited?.claimed && !newPlayer, onSubmit,
  };
}

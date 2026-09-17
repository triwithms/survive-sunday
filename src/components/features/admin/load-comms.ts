import "server-only";
import { listClaimableSeats } from "@/lib/claim-seat-db";
import { readEmailDeliveryStatus } from "@/lib/delivery";
import { loadAdminGate } from "./load-admin";
import type { CommsScreenProps } from "./types";

export async function loadCommsPage(): Promise<
  { ok: false; isDemo: boolean } | { ok: true; props: CommsScreenProps }
> {
  const gate = await loadAdminGate();
  if (!gate.ok) return { ok: false, isDemo: gate.isDemo };
  let seats: CommsScreenProps["seats"] = [];
  try {
    seats = await listClaimableSeats();
  } catch (error) {
    console.error("[admin] invite seats failed", error);
  }
  return {
    ok: true,
    props: { seats, delivery: readEmailDeliveryStatus() },
  };
}

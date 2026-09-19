/**
 * Reset notify hits every Administrator and never includes an OTP.
 *
 *   npx tsx scripts/verify-reset-admins.ts
 */
import {
  adminNotifyLooksSafe,
  collectAdminEmails,
  collectAdminPhones,
  resetAdminNotifyCopy,
  resetAdminUserIds,
} from "../src/lib/password-reset-notify";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

function main() {
  const notify = resetAdminNotifyCopy("JimmyC");
  assert(
    notify.text === "JimmyC requested a password reset.",
    "notify names the friend"
  );
  assert(adminNotifyLooksSafe(notify.text), "notify has no OTP");
  assert(adminNotifyLooksSafe(notify.subject), "subject has no OTP");
  assert(!adminNotifyLooksSafe("code 123456"), "rejects a 6-digit OTP");
  assert(
    collectAdminEmails([
      { email: "robertgama@gmail.com" },
      { email: "admin@survivesunday.demo" },
      { email: "robertgama@gmail.com" },
    ]).join(",") === "robertgama@gmail.com",
    "admin emails skip demo and dedupe"
  );
  assert(
    collectAdminPhones([
      { phoneE164: "+14165551212", email: "robertgama@gmail.com" },
      { phoneE164: "+14165559999", email: "admin@survivesunday.demo" },
    ]).join(",") === "+14165551212",
    "admin phones skip demo"
  );
  const union = resetAdminUserIds(
    [
      { userId: "is-admin", role: "member", isAdmin: true },
      { userId: "seat-admin", role: "admin", isAdmin: false },
    ],
    [{ userId: "grant-admin", role: "administrator" }]
  ).sort();
  assert(
    union.join(",") === "grant-admin,is-admin,seat-admin",
    `union all admin signals ${union}`
  );
  assert(resetAdminUserIds([], []).length === 0, "no admins → skip");
  console.log("PASS  reset notifies all admins, never an OTP");
}

main();

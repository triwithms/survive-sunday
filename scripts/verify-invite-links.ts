/**
 * Personal Join link helpers (no database).
 *
 *   npx tsx scripts/verify-invite-links.ts
 */
import assert from "node:assert/strict";
import type { ClaimableSeat } from "../src/lib/claim-seat";
import {
  arrivedViaPersonalInvite,
  nicknameInviteSlug,
  personalJoinPath,
  personalJoinWhoPath,
  personalSeatJoinUrl,
  personalWhoJoinUrl,
  PUBLIC_APP_ORIGIN,
  resolveSeatFromInvite,
} from "../src/lib/invite-link";

assert.equal(nicknameInviteSlug("Cannoli Stuffer"), "cannoli-stuffer");
assert.equal(nicknameInviteSlug("Go Giants"), "go-giants");
assert.equal(nicknameInviteSlug("Daddy Chill"), "daddy-chill");
assert.equal(nicknameInviteSlug("Deep and Delicious"), "deep-and-delicious");
assert.equal(nicknameInviteSlug("JaJa"), "jaja");
assert.equal(nicknameInviteSlug("  Long Snapper  "), "long-snapper");
assert.equal(nicknameInviteSlug("JimmyC"), "jimmyc");

const nicknames = [
  "Black Cobra",
  "Cannoli Stuffer",
  "Colin",
  "Daddy Chill",
  "Deep and Delicious",
  "Gams",
  "Gdogss",
  "Go Giants",
  "JimmyC",
  "Long Snapper",
  "Pauli",
  "JaJa",
  "Steve",
];
const slugs = nicknames.map(nicknameInviteSlug);
assert.equal(new Set(slugs).size, slugs.length, "BM Boys slugs must be unique");

assert.equal(
  personalJoinPath({ membershipId: "mem-1" }),
  "/join?seat=mem-1"
);
assert.equal(
  personalJoinWhoPath("Cannoli Stuffer"),
  "/join?who=cannoli-stuffer"
);
assert.equal(
  personalSeatJoinUrl(PUBLIC_APP_ORIGIN, "mem-1"),
  "https://survive-sunday.vercel.app/join?seat=mem-1"
);
assert.equal(
  personalWhoJoinUrl(PUBLIC_APP_ORIGIN, "Cannoli Stuffer"),
  "https://survive-sunday.vercel.app/join?who=cannoli-stuffer"
);

const seats: ClaimableSeat[] = [
  {
    membershipId: "open-1",
    nickname: "Cannoli Stuffer",
    realName: "Michael Frigo",
    claimed: false,
    label: "Cannoli Stuffer (Michael Frigo)",
  },
  {
    membershipId: "claimed-1",
    nickname: "Gams",
    realName: "Robert Gama",
    claimed: true,
    label: "Gams (Robert Gama)",
  },
];

assert.equal(
  resolveSeatFromInvite(seats, { seat: "open-1", who: null })?.nickname,
  "Cannoli Stuffer"
);
assert.equal(
  resolveSeatFromInvite(seats, { seat: null, who: "cannoli-stuffer" })?.nickname,
  "Cannoli Stuffer"
);
assert.equal(
  resolveSeatFromInvite(seats, { seat: "claimed-1", who: "cannoli-stuffer" })
    ?.nickname,
  "Gams",
  "seat id wins over who"
);
assert.equal(
  resolveSeatFromInvite(seats, { seat: null, who: "gams" })?.claimed,
  true
);
assert.equal(
  resolveSeatFromInvite(seats, { seat: "missing", who: null }),
  null
);
assert.equal(arrivedViaPersonalInvite({ seat: "open-1", who: "" }), true);
assert.equal(arrivedViaPersonalInvite({ seat: "", who: "gams" }), true);
assert.equal(arrivedViaPersonalInvite({ seat: "", who: "" }), false);

console.log("verify-invite-links OK");

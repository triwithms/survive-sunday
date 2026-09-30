-- Per-pool "Team logos" switch. Additive only.
-- Nullable with DEFAULT true: existing pools read as on, and null is on too.
-- Does not UPDATE or DELETE Membership, Pick, Week, Game, or Pool rows.

ALTER TABLE "Pool" ADD COLUMN IF NOT EXISTS "showTeamLogos" BOOLEAN DEFAULT true;

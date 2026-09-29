-- First week a pool counts. Additive only.
-- Null keeps classic Week-1 behaviour. Existing pools are unchanged.
-- Does not UPDATE or DELETE Membership, Pick, Week, Game, or Pool rows.

ALTER TABLE "Pool" ADD COLUMN IF NOT EXISTS "startWeek" INTEGER;

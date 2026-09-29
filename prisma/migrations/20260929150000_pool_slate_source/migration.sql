-- Multi-pool MVP. Additive only.
-- Pool-owned rows already store poolId (Membership, Week, PoolAccessRole,
-- WeekWrapSetting, AuditLog). Picks hang off Membership. This migration does
-- not UPDATE or DELETE those rows and does not re-key them.
-- Existing pools keep slatePoolId NULL and continue to own their Game rows.
-- The live family pool is that owner. New pools point slatePoolId at it.

ALTER TABLE "Pool" ADD COLUMN IF NOT EXISTS "slatePoolId" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Pool_slatePoolId_fkey'
  ) THEN
    ALTER TABLE "Pool"
      ADD CONSTRAINT "Pool_slatePoolId_fkey"
      FOREIGN KEY ("slatePoolId") REFERENCES "Pool"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Pool_slatePoolId_idx" ON "Pool"("slatePoolId");

-- Shared pool join link. New table only.
-- Does not UPDATE or DELETE Membership, Pick, Week, Game, or Pool rows.

CREATE TABLE IF NOT EXISTS "PoolInvite" (
  "id" TEXT NOT NULL,
  "poolId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PoolInvite_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PoolInvite_tokenHash_key" ON "PoolInvite"("tokenHash");
CREATE INDEX IF NOT EXISTS "PoolInvite_poolId_revokedAt_idx" ON "PoolInvite"("poolId", "revokedAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'PoolInvite_poolId_fkey'
  ) THEN
    ALTER TABLE "PoolInvite"
      ADD CONSTRAINT "PoolInvite_poolId_fkey"
      FOREIGN KEY ("poolId") REFERENCES "Pool"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

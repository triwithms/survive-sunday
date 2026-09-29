-- Entry-fee tracking labels. Additive only.
-- Does not UPDATE or DELETE Membership, Pick, Week, Game, or Pool rows.
-- Paid / Unpaid / Waived is a manual label. No money moves in the app.

ALTER TABLE "Pool" ADD COLUMN IF NOT EXISTS "paymentTrackingEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Pool" ADD COLUMN IF NOT EXISTS "entryFeeCents" INTEGER;
ALTER TABLE "Pool" ADD COLUMN IF NOT EXISTS "entryFeeCurrency" TEXT NOT NULL DEFAULT 'CAD';
ALTER TABLE "Pool" ADD COLUMN IF NOT EXISTS "paymentInstructions" TEXT;
ALTER TABLE "Pool" ADD COLUMN IF NOT EXISTS "paymentLink" TEXT;

ALTER TABLE "Membership" ADD COLUMN IF NOT EXISTS "paymentStatus" TEXT NOT NULL DEFAULT 'unpaid';
ALTER TABLE "Membership" ADD COLUMN IF NOT EXISTS "paymentMarkedAt" TIMESTAMP(3);
ALTER TABLE "Membership" ADD COLUMN IF NOT EXISTS "paymentNote" TEXT;

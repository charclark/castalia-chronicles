-- Add content snapshot field to FreeReadSubmission
-- Stores a frozen JSON snapshot of chapter/work content at the time of approval.
-- The public viewer reads from this field; future editor changes do NOT affect
-- the live published version. Null for older records (fall back to live content).
ALTER TABLE "FreeReadSubmission" ADD COLUMN "contentSnapshot" TEXT;

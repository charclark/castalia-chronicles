-- Staging area for edits to approved submissions.
-- When an author edits a live (approved) submission, the proposed changes
-- are stored here so the approved version stays visible until Char approves.

ALTER TABLE "FreeReadSubmission"
  ADD COLUMN "pendingEdits" TEXT,
  ADD COLUMN "pendingCoverImageData" BYTEA;

ALTER TABLE "DiscoverBooksSubmission"
  ADD COLUMN "pendingEdits" TEXT,
  ADD COLUMN "pendingCoverImageData" BYTEA;

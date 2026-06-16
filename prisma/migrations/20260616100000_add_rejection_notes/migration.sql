-- Add rejectionNote to all four submission/review models

ALTER TABLE "AuthorProfile" ADD COLUMN "rejectionNote" TEXT;
ALTER TABLE "JoinRequest" ADD COLUMN "rejectionNote" TEXT;
ALTER TABLE "FreeReadSubmission" ADD COLUMN "rejectionNote" TEXT;
ALTER TABLE "DiscoverBooksSubmission" ADD COLUMN "rejectionNote" TEXT;

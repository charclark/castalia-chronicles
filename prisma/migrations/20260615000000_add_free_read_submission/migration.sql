CREATE TABLE "FreeReadSubmission" (
  "id" TEXT NOT NULL,
  "workId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "submissionType" TEXT NOT NULL,
  "selectedChapterIds" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "contentRating" TEXT NOT NULL,
  "coverImageData" BYTEA,
  "coverBgIndex" INTEGER,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewedAt" TIMESTAMP(3),
  "publishedAt" TIMESTAMP(3),
  CONSTRAINT "FreeReadSubmission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FreeReadLike" (
  "id" TEXT NOT NULL,
  "submissionId" TEXT NOT NULL,
  "ipAddress" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FreeReadLike_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FreeReadSubmission_workId_key" ON "FreeReadSubmission"("workId");
CREATE INDEX "FreeReadSubmission_status_idx" ON "FreeReadSubmission"("status");
CREATE UNIQUE INDEX "FreeReadLike_submissionId_ipAddress_key" ON "FreeReadLike"("submissionId", "ipAddress");
CREATE INDEX "FreeReadLike_submissionId_idx" ON "FreeReadLike"("submissionId");

ALTER TABLE "FreeReadSubmission" ADD CONSTRAINT "FreeReadSubmission_workId_fkey"
  FOREIGN KEY ("workId") REFERENCES "Work"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FreeReadSubmission" ADD CONSTRAINT "FreeReadSubmission_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FreeReadLike" ADD CONSTRAINT "FreeReadLike_submissionId_fkey"
  FOREIGN KEY ("submissionId") REFERENCES "FreeReadSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

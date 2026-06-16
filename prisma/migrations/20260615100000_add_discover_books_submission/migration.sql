-- CreateTable: DiscoverBooksSubmission
CREATE TABLE "DiscoverBooksSubmission" (
    "id"               TEXT NOT NULL,
    "workId"           TEXT NOT NULL,
    "userId"           TEXT NOT NULL,
    "bookTitle"        TEXT NOT NULL,
    "authorName"       TEXT NOT NULL,
    "coverImageData"   BYTEA,
    "coverBgIndex"     INTEGER,
    "purchaseUrl"      TEXT NOT NULL,
    "purchaseLinkText" TEXT NOT NULL,
    "description"      TEXT NOT NULL,
    "contentRating"    TEXT NOT NULL,
    "status"           TEXT NOT NULL DEFAULT 'pending',
    "submittedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt"       TIMESTAMP(3),
    "publishedAt"      TIMESTAMP(3),

    CONSTRAINT "DiscoverBooksSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable: DiscoverBooksLike
CREATE TABLE "DiscoverBooksLike" (
    "id"           TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "ipAddress"    TEXT NOT NULL,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiscoverBooksLike_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DiscoverBooksSubmission_workId_key" ON "DiscoverBooksSubmission"("workId");
CREATE INDEX "DiscoverBooksSubmission_status_idx" ON "DiscoverBooksSubmission"("status");
CREATE UNIQUE INDEX "DiscoverBooksLike_submissionId_ipAddress_key" ON "DiscoverBooksLike"("submissionId", "ipAddress");
CREATE INDEX "DiscoverBooksLike_submissionId_idx" ON "DiscoverBooksLike"("submissionId");

-- AddForeignKey
ALTER TABLE "DiscoverBooksSubmission" ADD CONSTRAINT "DiscoverBooksSubmission_workId_fkey"
    FOREIGN KEY ("workId") REFERENCES "Work"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DiscoverBooksSubmission" ADD CONSTRAINT "DiscoverBooksSubmission_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DiscoverBooksLike" ADD CONSTRAINT "DiscoverBooksLike_submissionId_fkey"
    FOREIGN KEY ("submissionId") REFERENCES "DiscoverBooksSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

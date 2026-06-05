-- AddColumns: ownership and archiving on Universe
ALTER TABLE "Universe" ADD COLUMN "createdByUserId" TEXT;
ALTER TABLE "Universe" ADD COLUMN "archivedAt" TIMESTAMP(3);
ALTER TABLE "Universe" ADD COLUMN "archivedByUserId" TEXT;

-- CreateIndex
CREATE INDEX "Universe_createdByUserId_idx" ON "Universe"("createdByUserId");
CREATE INDEX "Universe_archivedAt_idx" ON "Universe"("archivedAt");

-- AddForeignKey
ALTER TABLE "Universe" ADD CONSTRAINT "Universe_createdByUserId_fkey"
    FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Universe" ADD CONSTRAINT "Universe_archivedByUserId_fkey"
    FOREIGN KEY ("archivedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
